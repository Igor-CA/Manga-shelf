const Post = require("../models/Post");
const Series = require("../models/Series");
const Volume = require("../models/volume");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

const POSTS_PER_PAGE = 20;

exports.createPost = asyncHandler(async (req, res) => {
	const { seriesId, volumeId, text } = req.body;

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

	const post = await Post.create({
		author: req.user._id,
		series: seriesId,
		volume: volumeId || null,
		text,
	});

	res.status(201).json({ msg: "Comentário publicado com sucesso", post });
});

exports.getPosts = asyncHandler(async (req, res) => {
	const { seriesId, volumeId } = req.query;
	if (!mongoose.Types.ObjectId.isValid(seriesId)) {
		return res.status(400).json({ msg: "ID de obra inválido" });
	}

	const page = parseInt(req.query.p) || 1;
	const skip = POSTS_PER_PAGE * (page - 1);

	const posts = await Post.aggregate([
		{
			$match: {
				series: new mongoose.Types.ObjectId(seriesId),
				volume: volumeId ? new mongoose.Types.ObjectId(volumeId) : null,
			},
		},
		{ $sort: { createdAt: -1 } },
		{ $skip: skip },
		{ $limit: POSTS_PER_PAGE },
		{
			$lookup: {
				from: "users",
				localField: "author",
				foreignField: "_id",
				as: "authorInfo",
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
		{ $unwind: "$authorInfo" },
		{
			$project: {
				_id: 1,
				text: 1,
				createdAt: 1,
				updatedAt: 1,
				author: "$authorInfo",
			},
		},
	]);

	res.json(posts);
});

exports.deletePost = asyncHandler(async (req, res) => {
	const postId = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(postId)) {
		return res.status(400).json({ msg: "ID de comentário inválido" });
	}

	const post = await Post.findById(postId);
	if (!post) {
		return res.status(404).json({ msg: "Comentário não encontrado" });
	}

	if (post.author.toString() !== req.user._id.toString()) {
		return res.status(403).json({ msg: "Não autorizado" });
	}

	await Post.findByIdAndDelete(postId);

	res.json({ msg: "Comentário removido com sucesso" });
});
