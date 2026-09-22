const Submission = require("../models/Submission");
const Series = require("../models/Series");
const volume = require("../models/volume");
const User = require("../models/User");
const ExternalLink = require("../models/ExternalLink");
const LinkProvider = require("../models/LinkProvider");
const _ = require("lodash");
const asyncHandler = require("express-async-handler");
const logger = require("../Utils/logger");
const { getVolumeCoverURL } = require("../Utils/getCoverFunctions");
const {
	getActiveProviders,
	buildUrl,
	applyAffiliate,
} = require("../Utils/linkProviders");
const { resolveProviderLink } = require("./links");

const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const EDITABLE_SUBMISSION_FIELDS = {
	Series: [
		"title",
		"synonyms",
		"authors",
		"summary",
		"genres",
		"publisher",
		"demographic",
		"type",
		"status",
		"dates",
		"specs",
		"originalRun",
		"ageRating",
	],
	Volume: [
		"number",
		"ISBN",
		"pagesNumber",
		"date",
		"summary",
		"defaultPrice",
		"freebies",
		"chapters",
	],
};

const processAndSaveEvidence = async (buffer, userId) => {
	const folderPath = path.resolve("public/images/evidence");
	const filename = `${userId}-${Date.now()}.webp`;
	const fullPath = path.join(folderPath, filename);

	if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath, { recursive: true });
	}

	await sharp(buffer)
		.resize({ width: 1280, withoutEnlargement: true })
		.webp({ quality: 80 })
		.toFile(fullPath);

	return `/images/evidence/${filename}`;
};

exports.createSubmission = asyncHandler(async (req, res, next) => {
	let { targetModel, targetId, payload, notes } = req.body;
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

	let evidenceImageUrl = "";
	if (req.file) {
		try {
			evidenceImageUrl = await processAndSaveEvidence(req.file.buffer, userId);
		} catch (error) {
			logger.error("Error processing evidence image:", error);
			return res
				.status(500)
				.json({ msg: "Erro ao processar a imagem de comprovante." });
		}
	}
	const newSubmission = new Submission({
		user: userId,
		targetModel,
		targetId: targetId || null,
		payload,
		notes,
		status: "Pendente",
		evidenceImage: evidenceImageUrl,
	});

	await newSubmission.save();

	return res.status(201).json({
		msg: "Sugestão enviada com sucesso! Aguardando análise da moderação.",
		submissionId: newSubmission._id,
	});
});

exports.createLinkSubmission = asyncHandler(async (req, res) => {
	const { targetModel, targetId, notes, links } = req.body || {};
	const userId = req.user._id;

	if (!["Series", "Volume"].includes(targetModel)) {
		return res.status(400).json({ msg: "Alvo inválido." });
	}

	const targetExists =
		targetModel === "Series"
			? await Series.exists({ _id: targetId })
			: await volume.exists({ _id: targetId });

	if (!targetExists) {
		return res.status(404).json({
			msg: "O recurso que você está tentando editar não foi encontrado.",
		});
	}

	const addRows = Array.isArray(links?.add) ? links.add : [];
	const removeRows = Array.isArray(links?.remove) ? links.remove : [];
	if (!addRows.length && !removeRows.length) {
		return res
			.status(400)
			.json({ msg: "Nenhum link foi adicionado ou removido." });
	}

	const activeProviders = await getActiveProviders();

	const add = [];
	for (const row of addRows) {
		const resolved = resolveProviderLink(
			row?.provider,
			row?.url,
			activeProviders,
		);
		if (resolved.error) return res.status(400).json({ msg: resolved.error });
		add.push({ provider: resolved.provider, externalId: resolved.externalId });
	}

	const remove = [];
	for (const row of removeRows) {
		if (!row?.provider || typeof row.provider !== "string") {
			return res.status(400).json({ msg: "Link a remover inválido." });
		}
		remove.push({ provider: row.provider });
	}

	const newSubmission = new Submission({
		user: userId,
		targetModel,
		targetId,
		payload: { links: { add, remove } },
		notes: notes || "",
		status: "Pendente",
	});

	await newSubmission.save();

	return res.status(201).json({
		msg: "Sugestão enviada com sucesso! Aguardando análise da moderação.",
		submissionId: newSubmission._id,
	});
});

const applyLinkSubmission = async (submission) => {
	const { targetModel, targetId } = submission;
	const { add = [], remove = [] } = submission.payload?.links || {};

	for (const { provider, externalId } of add) {
		await ExternalLink.findOneAndUpdate(
			{ targetModel, targetId, provider },
			{ $set: { externalId } },
			{ upsert: true },
		);
	}

	if (remove.length) {
		await ExternalLink.deleteMany({
			targetModel,
			targetId,
			provider: { $in: remove.map((row) => row.provider) },
		});
	}
};

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
		if (submission.targetId) {
			targetDocument = await volume.findById(submission.targetId);
		}
	}

	if (!targetDocument)
		return res.status(404).json({ msg: "Obra alvo não encontrada." });

	if (submission.payload?.links) {
		await applyLinkSubmission(submission);
	} else {
		const safePayload = _.pick(
			submission.payload,
			EDITABLE_SUBMISSION_FIELDS[submission.targetModel] || [],
		);

		const customizer = (objValue, srcValue) => {
			if (_.isArray(srcValue)) {
				return srcValue;
			}
		};

		_.mergeWith(targetDocument, safePayload, customizer);

		if (submission.targetModel === "Series") {
			targetDocument.markModified("specs");
			targetDocument.markModified("dates");
			targetDocument.markModified("originalRun");
		}
		await targetDocument.save();
	}

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

const attachLinksPreview = async (submissions) => {
	const linkSubmissions = submissions.filter((s) => s.payload?.links);
	if (!linkSubmissions.length) return submissions;

	const providersByKey = new Map(
		(await LinkProvider.find().lean()).map((p) => [p.key, p]),
	);

	const targetIdOf = (submission) =>
		submission.targetId?._id ?? submission.targetId;

	const wanted = linkSubmissions.flatMap((submission) => {
		const { add = [], remove = [] } = submission.payload.links;
		return [...add, ...remove].map((row) => ({
			targetModel: submission.targetModel,
			targetId: targetIdOf(submission),
			provider: row.provider,
		}));
	});

	const currentIds = new Map();
	if (wanted.length) {
		const existing = await ExternalLink.find({ $or: wanted }).lean();
		for (const link of existing) {
			currentIds.set(
				`${link.targetModel}:${link.targetId}:${link.provider}`,
				link.externalId,
			);
		}
	}

	const urlFor = (providerDoc, externalId) =>
		providerDoc && externalId
			? applyAffiliate(providerDoc, buildUrl(providerDoc, externalId))
			: null;

	return submissions.map((submission) => {
		if (!submission.payload?.links) return submission;

		const { add = [], remove = [] } = submission.payload.links;
		const currentFor = (provider) =>
			currentIds.get(
				`${submission.targetModel}:${targetIdOf(submission)}:${provider}`,
			);

		const linksPreview = [
			...add.map((row) => {
				const providerDoc = providersByKey.get(row.provider);
				const current = currentFor(row.provider);
				return {
					action: current ? "update" : "add",
					provider: row.provider,
					name: providerDoc?.name || row.provider,
					newUrl: urlFor(providerDoc, row.externalId),
					oldUrl: urlFor(providerDoc, current),
				};
			}),
			...remove.map((row) => {
				const providerDoc = providersByKey.get(row.provider);
				return {
					action: "remove",
					provider: row.provider,
					name: providerDoc?.name || row.provider,
					newUrl: null,
					oldUrl: urlFor(providerDoc, currentFor(row.provider)),
				};
			}),
		];

		return { ...submission.toObject(), linksPreview };
	});
};

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

	submissions.sort(
		(a, b) =>
			a.createdAt - b.createdAt ||
			(a.targetId?.number ?? 0) - (b.targetId?.number ?? 0),
	);

	res.json(await attachLinksPreview(submissions));
});

exports.getUserSubmissions = asyncHandler(async (req, res) => {
	const { username } = req.params;
	if (!username) return res.send({ msg: "Nenhum usuário informado" });

	const user = await User.findOne({ username }).select("_id").lean();
	if (!user) return res.status(404).json({ msg: "Usuário não encontrado" });

	const submissions = await Submission.find({ user: user._id })
		.select(
			"user targetId targetModel status createdAt adminComment evidenceImage",
		)
		.populate("user", "username email")
		.populate({
			path: "targetId",
			select: "title number isVariant variantNumber seriesCover",
			populate: {
				path: "serie",
				select: "title",
				strictPopulate: false,
			},
		})
		.sort({ createdAt: -1 });

	submissions.sort(
		(a, b) =>
			b.createdAt - a.createdAt ||
			(a.targetId?.number ?? 0) - (b.targetId?.number ?? 0),
	);

	const imageSubmissions = submissions.map((submission) => {
		let cover = submission?.targetId?.seriesCover || "";
		if (submission.targetModel === "Volume" && submission.targetId?.serie) {
			const { serie, number, isVariant, variantNumber } = submission.targetId;
			cover = getVolumeCoverURL(serie, number, isVariant, variantNumber);
		}
		return { cover, ...submission._doc };
	});
	res.json(imageSubmissions);
});
