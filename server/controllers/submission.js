const Submission = require("../models/Submission");
const Series = require("../models/Series");
const volume = require("../models/volume");
const _ = require("lodash");
const asyncHandler = require("express-async-handler");
const logger = require("../Utils/logger");
const { getVolumeCoverURL } = require("../Utils/getCoverFunctions");
const User = require("../models/User");

exports.createSubmission = asyncHandler(async (req, res, next) => {
	const { targetModel, targetId, payload, notes } = req.body;
	const userId = req.user._id;

	if (targetId) {
		let resourceExists = false;

		if (targetModel === "Series") {
			const series = await Series.findById(targetId);
			if (series) resourceExists = true;
		} else if (targetModel === "Volume") {
			const volumeObj = await volume.findById(targetId);
			if (volumeObj) resourceExists = true;
		}

		if (!resourceExists) {
			return res.status(404).json({
				msg: "O recurso que você está tentando editar não foi encontrado.",
			});
		}
	}

	const newSubmission = new Submission({
		user: userId,
		targetModel,
		targetId: targetId || null,
		payload,
		notes,
		status: "Pendente",
	});

	await newSubmission.save();

	return res.status(201).json({
		msg: "Sugestão enviada com sucesso! Aguardando análise da moderação.",
		submissionId: newSubmission._id,
	});
});

exports.approveSubmission = asyncHandler(async (req, res, next) => {
	const { id } = req.params;

	const submission = await Submission.findById(id);
	if (!submission)
		return res.status(404).json({ msg: "Submissão não encontrada" });

	if (submission.status !== "Pendente") {
		return res.status(400).json({ msg: "Esta submissão já foi processada." });
	}

	let targetDocument;

	if (submission.targetModel === "Series") {
		if (submission.targetId) {
			targetDocument = await Series.findById(submission.targetId);
		}
	} else if (submission.targetModel === "Volume") {
		targetDocument = await volume.findById(submission.targetId);
	}

	if (!targetDocument)
		return res.status(404).json({ msg: "Obra alvo não encontrada." });

	delete submission.payload._id;

	const customizer = (objValue, srcValue) => {
		if (_.isArray(srcValue)) {
			return srcValue;
		}
	};

	_.mergeWith(targetDocument, submission.payload, customizer);

	if (submission.targetModel === "Series") {
		targetDocument.markModified("specs");
		targetDocument.markModified("dates");
		targetDocument.markModified("originalRun");
	}
	await targetDocument.save();

	submission.status = "Aprovado";
	submission.adminComment = req.body.adminComment;
	submission.reviewedBy = req.user._id;
	await submission.save();

	res.json({ msg: "Aprovação realizada com sucesso!", data: targetDocument });
});
exports.rejectSubmission = asyncHandler(async (req, res) => {
	const { id } = req.params;

	const submission = await Submission.findById(id);
	if (!submission)
		return res.status(404).json({ msg: "Submissão não encontrada" });

	if (submission.status !== "Pendente") {
		return res.status(400).json({ msg: "Esta submissão já foi processada." });
	}

	submission.status = "Rejeitado";
	submission.adminComment = req.body.adminComment;
	submission.reviewedBy = req.user._id;
	await submission.save();

	res.json({ msg: "Submissão rejeitada com sucesso!" });
});

exports.getPendingSubmissions = asyncHandler(async (req, res) => {
	const submissions = await Submission.find({ status: "Pendente" })
		.populate("user", "username email")
		.populate({
			path: "targetId",
			populate: {
				path: "serie",
				select: "title",
				strictPopulate: false,
			},
		})
		.sort({ createdAt: 1 });
	res.json(submissions);
});

exports.getUserSubmissions = asyncHandler(async (req, res) => {
	const { username } = req.params;
	if (!username) return res.send({ msg: "Nenhum usuário informado" });

	const user = await User.findOne({ username }).select("_id").lean();
	const submissions = await Submission.find({ user })
		.select("user targetId targetModel status createdAt adminComment")
		.populate("user", "username email")
		.populate({
			path: "targetId",
			select: "title number variant variantNumber",
			populate: {
				path: "serie",
				select: "title",
				strictPopulate: false,
			},
		})
		.sort({ createdAt: -1 });

	const imageSubmissions = submissions.map((submission) => {
		let cover = submission?.targetId?.seriesCover || "";
		if (submission.targetModel === "Volume") {
			const { serie, number, variant, variantNumber } = submission.targetId;
			cover = getVolumeCoverURL(serie, number, variant, variantNumber);
		}
		return { cover, ...submission._doc };
	});
	res.json(imageSubmissions);
});
