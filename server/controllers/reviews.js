const Review = require("../models/Review");
const Series = require("../models/Series");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

const REVIEWS_PER_PAGE = 20;

const recalculateSeriesRating = async (seriesId) => {
	const result = await Review.aggregate([
		{ $match: { series: new mongoose.Types.ObjectId(seriesId) } },
		{
			$group: {
				_id: null,
				avg: { $avg: "$score" },
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

exports.getSeriesReviews = asyncHandler(async (req, res) => {
	const seriesId = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(seriesId)) {
		return res.status(400).json({ msg: "ID de obra inválido" });
	}

	const page = parseInt(req.query.p) || 1;
	const skip = REVIEWS_PER_PAGE * (page - 1);

	const reviews = await Review.aggregate([
		{ $match: { series: new mongoose.Types.ObjectId(seriesId) } },
		{ $sort: { createdAt: -1 } },
		{ $skip: skip },
		{ $limit: REVIEWS_PER_PAGE },
		{
			$lookup: {
				from: "users",
				localField: "user",
				foreignField: "_id",
				as: "userInfo",
				pipeline: [
					{
						$project: {
							username: 1,
							profileImageUrl: 1,
						},
					},
				],
			},
		},
		{ $unwind: "$userInfo" },
		{
			$project: {
				_id: 1,
				score: 1,
				text: 1,
				createdAt: 1,
				updatedAt: 1,
				user: "$userInfo",
			},
		},
	]);

	res.json(reviews);
});

exports.getUserReview = asyncHandler(async (req, res) => {
	const seriesId = req.params.seriesId;
	if (!mongoose.Types.ObjectId.isValid(seriesId)) {
		return res.status(400).json({ msg: "ID de obra inválido" });
	}

	const review = await Review.findOne({
		user: req.user._id,
		series: seriesId,
	});

	res.json({ review });
});

exports.upsertReview = asyncHandler(async (req, res) => {
	const { seriesId, score, text } = req.body;

	const series = await Series.findById(seriesId);
	if (!series) {
		return res.status(404).json({ msg: "Obra não encontrada" });
	}

	await Review.findOneAndUpdate(
		{ user: req.user._id, series: seriesId },
		{ score, text: text || "" },
		{ upsert: true, new: true },
	);

	await recalculateSeriesRating(seriesId);

	res.json({ msg: "Review salva com sucesso" });
});

exports.deleteReview = asyncHandler(async (req, res) => {
	const reviewId = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(reviewId)) {
		return res.status(400).json({ msg: "ID de review inválido" });
	}

	const review = await Review.findById(reviewId);
	if (!review) {
		return res.status(404).json({ msg: "Review não encontrada" });
	}

	if (review.user.toString() !== req.user._id.toString()) {
		return res.status(403).json({ msg: "Não autorizado" });
	}

	const seriesId = review.series;
	await Review.findByIdAndDelete(reviewId);
	await recalculateSeriesRating(seriesId);

	res.json({ msg: "Review removida com sucesso" });
});
