const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const Post = require("../models/Post");
const PostReport = require("../models/PostReport");
const { deletePostCascade, unlinkImages } = require("./post");
const { sendPostHiddenNotification } = require("./notifications");

const REPORT_THRESHOLDS = { hate: 1, adult: 1, spoiler: 1 };

exports.createReport = asyncHandler(async (req, res) => {
	const postId = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(postId)) {
		return res.status(400).json({ msg: "ID de comentário inválido" });
	}

	const post = await Post.findById(postId);
	if (!post) {
		return res.status(404).json({ msg: "Comentário não encontrado" });
	}

	const { reason } = req.body;

	try {
		await PostReport.create({
			reporter: req.user._id,
			post: post._id,
			reason,
			reportedText: post.text,
		});
	} catch (err) {
		if (err.code !== 11000) throw err;
	}

	const pendingCount = await PostReport.countDocuments({
		post: post._id,
		reason,
		status: "Pendente",
	});

	if (pendingCount >= REPORT_THRESHOLDS[reason]) {
		if (reason === "adult") {
			await Post.updateOne({ _id: post._id }, { isAdultContent: true });
			await PostReport.updateMany(
				{ post: post._id, reason, status: "Pendente" },
				{ status: "Resolvido", resolution: "auto-adult", reviewedBy: null },
			);
		} else if (reason === "spoiler") {
			await Post.updateOne({ _id: post._id }, { isSpoiler: true });
			await PostReport.updateMany(
				{ post: post._id, reason, status: "Pendente" },
				{ status: "Resolvido", resolution: "auto-spoiler", reviewedBy: null },
			);
		} else if (reason === "hate") {
			const hidden = await Post.findOneAndUpdate(
				{ _id: post._id, isHidden: false },
				{ isHidden: true },
			);
			if (hidden) {
				sendPostHiddenNotification(post).catch(() => {});
			}
		}
	}

	res.json({ msg: "Denúncia recebida" });
});

exports.getPendingReports = asyncHandler(async (req, res) => {
	const reports = await PostReport.find({ status: "Pendente", reason: "hate" })
		.populate("reporter", "username")
		.populate({
			path: "post",
			select: "author text series volume isHidden",
			populate: { path: "author", select: "username" },
		})
		.sort({ createdAt: 1 });
	res.json(reports);
});

exports.deleteReportedPost = asyncHandler(async (req, res) => {
	const report = await PostReport.findById(req.params.id);
	if (!report) {
		return res.status(404).json({ msg: "Denúncia não encontrada" });
	}
	if (report.status !== "Pendente") {
		return res.status(400).json({ msg: "Esta denúncia já foi processada." });
	}

	const post = await Post.findById(report.post);
	if (!post) {
		return res.status(404).json({ msg: "Comentário não encontrado" });
	}

	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const imagePaths = await deletePostCascade(post, session);
		await session.commitTransaction();
		unlinkImages(imagePaths);
	} catch (err) {
		if (session.inTransaction()) await session.abortTransaction();
		throw err;
	} finally {
		session.endSession();
	}

	await PostReport.updateMany(
		{ post: post._id, status: "Pendente" },
		{ status: "Resolvido", resolution: "deleted", reviewedBy: req.user._id },
	);

	res.json({ msg: "Comentário removido com sucesso" });
});

exports.restoreReportedPost = asyncHandler(async (req, res) => {
	const report = await PostReport.findById(req.params.id);
	if (!report) {
		return res.status(404).json({ msg: "Denúncia não encontrada" });
	}
	if (report.status !== "Pendente") {
		return res.status(400).json({ msg: "Esta denúncia já foi processada." });
	}

	await Post.updateOne({ _id: report.post }, { isHidden: false });

	await PostReport.updateMany(
		{ post: report.post, status: "Pendente" },
		{ status: "Descartado", resolution: "restored", reviewedBy: req.user._id },
	);

	res.json({ msg: "Comentário restaurado com sucesso" });
});
