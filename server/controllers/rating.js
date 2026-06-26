const Rating = require("../models/Rating");
const Series = require("../models/Series");
const Volume = require("../models/volume");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

const recalcVolumeRating = async (volumeId) => {
	const result = await Rating.aggregate([
		{ $match: { volume: new mongoose.Types.ObjectId(volumeId) } },
		{ $group: { _id: null, avg: { $avg: "$score" }, count: { $sum: 1 } } },
	]);
	const { avg = 0, count = 0 } = result[0] || {};
	await Volume.findByIdAndUpdate(volumeId, {
		ratingAverage: Math.round(avg * 10) / 10,
		ratingCount: count,
	});
};

// Recompute and store Series.ratingAverage / ratingCount
// Per-user effective score = manual series score ?? mean of their volume scores
const recalcSeriesRating = async (seriesId) => {
	const result = await Rating.aggregate([
		{ $match: { series: new mongoose.Types.ObjectId(seriesId) } },
		{
			$group: {
				_id: "$user",
				manualScore: {
					$max: { $cond: [{ $eq: ["$volume", null] }, "$score", null] },
				},
				volumeScores: {
					$push: { $cond: [{ $ne: ["$volume", null] }, "$score", "$$REMOVE"] },
				},
			},
		},
		{
			$addFields: {
				effectiveScore: {
					$cond: [
						{ $ne: ["$manualScore", null] },
						"$manualScore",
						{ $cond: [{ $gt: [{ $size: "$volumeScores" }, 0] }, { $avg: "$volumeScores" }, null] },
					],
				},
			},
		},
		{ $match: { effectiveScore: { $ne: null } } },
		{
			$group: {
				_id: null,
				avg: { $avg: "$effectiveScore" },
				count: { $sum: 1 },
			},
		},
	]);
	const { avg = 0, count = 0 } = result[0] || {};
	await Series.findByIdAndUpdate(seriesId, {
		ratingAverage: Math.round(avg * 10) / 10,
		ratingCount: count,
	});
};

exports.upsertRating = asyncHandler(async (req, res) => {
	const { seriesId, volumeId, score } = req.body;

	const series = await Series.findById(seriesId).select("_id");
	if (!series) {
		return res.status(404).json({ msg: "Obra não encontrada" });
	}

	if (volumeId) {
		const volume = await Volume.findById(volumeId).select("_id");
		if (!volume) {
			return res.status(404).json({ msg: "Volume não encontrado" });
		}
	}

	await Rating.findOneAndUpdate(
		{ user: req.user._id, series: seriesId, volume: volumeId || null },
		{ score },
		{ upsert: true, new: true },
	);

	if (volumeId) {
		await recalcVolumeRating(volumeId);

		const hasManualSeriesScore = await Rating.exists({
			user: req.user._id,
			series: seriesId,
			volume: null,
		});
		if (!hasManualSeriesScore) {
			await recalcSeriesRating(seriesId);
		}
	} else {
		await recalcSeriesRating(seriesId);
	}

	res.json({ msg: "Nota salva com sucesso" });
});

exports.removeRating = asyncHandler(async (req, res) => {
	const { seriesId, volumeId } = req.body;

	const deleted = await Rating.findOneAndDelete({
		user: req.user._id,
		series: seriesId,
		volume: volumeId || null,
	});

	if (!deleted) {
		return res.status(404).json({ msg: "Nota não encontrada" });
	}

	if (volumeId) {
		await recalcVolumeRating(volumeId);
		const hasManualSeriesScore = await Rating.exists({
			user: req.user._id,
			series: seriesId,
			volume: null,
		});
		if (!hasManualSeriesScore) {
			await recalcSeriesRating(seriesId);
		}
	} else {
		await recalcSeriesRating(seriesId);
	}

	res.json({ msg: "Nota removida com sucesso" });
});

exports.recalcVolumeRating = recalcVolumeRating;
exports.recalcSeriesRating = recalcSeriesRating;
