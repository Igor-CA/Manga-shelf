const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const LinkProvider = require("../models/LinkProvider");
const LinkClick = require("../models/LinkClick");

exports.recordClick = asyncHandler(async (req, res) => {
	const { provider, targetModel, targetId } = req.body || {};

	if (
		!["Series", "Volume"].includes(targetModel) ||
		!mongoose.Types.ObjectId.isValid(targetId)
	) {
		return res.status(400).json({ msg: "Alvo inválido." });
	}

	const exists = await LinkProvider.exists({ key: provider });
	if (!exists) {
		return res.status(404).json({ msg: "Provedor desconhecido." });
	}

	await LinkClick.updateOne(
		{ provider, targetModel, targetId },
		{ $inc: { count: 1 }, $set: { lastClickedAt: new Date() } },
		{ upsert: true },
	);

	res.status(204).end();
});
