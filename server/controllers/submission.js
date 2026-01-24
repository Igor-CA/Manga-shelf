const Submission = require("../models/Submission");
const Series = require("../models/Series");
const volume = require("../models/volume");
const expressAsyncHandler = require("express-async-handler");

exports.createSubmission = expressAsyncHandler(async (req, res, next) => {
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
