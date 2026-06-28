const Post = require("../models/Post");
const Like = require("../models/Like");
const Series = require("../models/Series");
const Volume = require("../models/volume");
const Notification = require("../models/Notification");
const UserNotificationStatus = require("../models/UserNotificationStatus");
const User = require("../models/User");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const { sendNewReplyNotification, sendNewLikeNotification } = require("./notifications");

const POSTS_PER_PAGE = 20;
const REPLIES_PER_PAGE = 5;


const AUTHOR_PROJECTION = { username: 1, profileImageUrl: 1 };

const attachAuthorStages = [
	{
		$lookup: {
			from: "users",
			localField: "author",
			foreignField: "_id",
			as: "authorInfo",
			pipeline: [{ $project: AUTHOR_PROJECTION }],
		},
	},
	{ $unwind: "$authorInfo" },
];

const basePostProjection = {
	_id: 1,
	text: 1,
	createdAt: 1,
	updatedAt: 1,
	author: "$authorInfo",
	likeCount: { $ifNull: ["$likeCount", 0] },
	likedByViewer: 1,
};

function makeViewerLikeStages(viewerId) {
	if (viewerId) {
		return [
			{
				$lookup: {
					from: "likes",
					let: { postId: "$_id" },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ["$user", new mongoose.Types.ObjectId(viewerId)] },
										{ $eq: ["$post", "$$postId"] },
									],
								},
							},
						},
						{ $limit: 1 },
					],
					as: "viewerLike",
				},
			},
			{
				$addFields: {
					likedByViewer: { $gt: [{ $size: "$viewerLike" }, 0] },
				},
			},
			{ $unset: "viewerLike" },
		];
	}
	return [{ $addFields: { likedByViewer: false } }];
}

async function resolveReplyTarget(parentId, seriesId, volumeId) {
	const targetPost = await Post.findById(parentId).select(
		"author series volume parent",
	);
	if (!targetPost) {
		return { error: { status: 404, msg: "Comentário pai não encontrado" } };
	}

	const sameSeries = targetPost.series.toString() === seriesId;
	const targetVolume = targetPost.volume ? targetPost.volume.toString() : null;
	const sameVolume = targetVolume === volumeId;
	if (!sameSeries || !sameVolume) {
		return {
			error: { status: 400, msg: "Comentário pai pertence a outro alvo" },
		};
	}

	return {
		notifyRecipientId: targetPost.author,
		topLevelParentId: targetPost.parent || targetPost._id,
	};
}

async function cleanupPostNotifications(targetIds, session) {
	const notifDocs = await Notification.find(
		{ associatedObject: { $in: targetIds }, objectType: "Post" },
		"_id",
	).session(session);
	const notifIds = notifDocs.map((n) => n._id);
	if (notifIds.length === 0) return;

	await User.updateMany(
		{ "notifications.notification": { $in: notifIds } },
		{ $pull: { notifications: { notification: { $in: notifIds } } } },
	).session(session);
	await UserNotificationStatus.deleteMany({
		notification: { $in: notifIds },
	}).session(session);
	await Notification.deleteMany({ _id: { $in: notifIds } }).session(session);
}


exports.createPost = asyncHandler(async (req, res) => {
	const { seriesId, volumeId, text, parentId } = req.body;

	const series = await Series.findById(seriesId).select("_id title");
	if (!series) {
		return res.status(404).json({ msg: "Obra não encontrada" });
	}

	if (volumeId) {
		const volume = await Volume.findById(volumeId).select("_id");
		if (!volume) {
			return res.status(404).json({ msg: "Volume não encontrado" });
		}
	}

	let topLevelParentId = null;
	let notifyRecipientId = null;

	if (parentId) {
		const resolved = await resolveReplyTarget(
			parentId,
			seriesId,
			volumeId || null,
		);
		if (resolved.error) {
			return res.status(resolved.error.status).json({ msg: resolved.error.msg });
		}
		({ topLevelParentId, notifyRecipientId } = resolved);
	}

	const post = await Post.create({
		author: req.user._id,
		series: seriesId,
		volume: volumeId || null,
		text,
		parent: topLevelParentId,
	});

	if (topLevelParentId) {
		await Post.findByIdAndUpdate(topLevelParentId, { $inc: { replyCount: 1 } });

		const isSelfReply =
			notifyRecipientId.toString() === req.user._id.toString();
		if (!isSelfReply) {
			sendNewReplyNotification(
				post,
				notifyRecipientId,
				series.title,
				seriesId,
				volumeId || null,
			).catch(() => {});
		}
	}

	res.status(201).json({ msg: "Comentário publicado com sucesso", post });
});

exports.getPosts = asyncHandler(async (req, res) => {
	const { seriesId, volumeId, sort } = req.query;
	if (!mongoose.Types.ObjectId.isValid(seriesId)) {
		return res.status(400).json({ msg: "ID de obra inválido" });
	}

	const page = parseInt(req.query.p) || 1;
	const skip = POSTS_PER_PAGE * (page - 1);

	const sortStage = sort === "recent"
		? { createdAt: -1 }
		: { likeCount: -1, createdAt: -1 };

	const viewerId = req.user ? req.user._id : null;
	const viewerLikeStages = makeViewerLikeStages(viewerId);

	const posts = await Post.aggregate([
		{
			$match: {
				series: new mongoose.Types.ObjectId(seriesId),
				volume: volumeId ? new mongoose.Types.ObjectId(volumeId) : null,
				parent: null,
			},
		},
		{ $sort: sortStage },
		{ $skip: skip },
		{ $limit: POSTS_PER_PAGE },
		...attachAuthorStages,
		...viewerLikeStages,
		{
			$lookup: {
				from: "posts",
				let: { postId: "$_id" },
				pipeline: [
					{ $match: { $expr: { $eq: ["$parent", "$$postId"] } } },
					{ $sort: { createdAt: 1 } },
					{ $limit: 1 },
					...attachAuthorStages,
					...makeViewerLikeStages(viewerId),
					{ $project: basePostProjection },
				],
				as: "replyPreviewArr",
			},
		},
		{
			$project: {
				...basePostProjection,
				replyCount: 1,
				replyPreview: { $arrayElemAt: ["$replyPreviewArr", 0] },
			},
		},
	]);

	res.json(posts);
});

exports.getReplies = asyncHandler(async (req, res) => {
	const postId = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(postId)) {
		return res.status(400).json({ msg: "ID de comentário inválido" });
	}

	const page = parseInt(req.query.p) || 1;
	const skip = REPLIES_PER_PAGE * (page - 1);

	const viewerLikeStages = makeViewerLikeStages(req.user ? req.user._id : null);

	const replies = await Post.aggregate([
		{ $match: { parent: new mongoose.Types.ObjectId(postId) } },
		{ $sort: { createdAt: 1 } },
		{ $skip: skip },
		{ $limit: REPLIES_PER_PAGE },
		...attachAuthorStages,
		...viewerLikeStages,
		{ $project: basePostProjection },
	]);

	res.json(replies);
});

exports.likePost = asyncHandler(async (req, res) => {
	const postId = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(postId)) {
		return res.status(400).json({ msg: "ID de comentário inválido" });
	}

	const post = await Post.findById(postId);
	if (!post) {
		return res.status(404).json({ msg: "Comentário não encontrado" });
	}

	const result = await Like.updateOne(
		{ user: req.user._id, post: postId },
		{},
		{ upsert: true },
	);

	let likeCount = post.likeCount || 0;
	if (result.upsertedCount === 1) {
		const updated = await Post.findByIdAndUpdate(
			postId,
			{ $inc: { likeCount: 1 } },
			{ new: true },
		).select("likeCount");
		likeCount = updated.likeCount;

		const isSelfLike = post.author.toString() === req.user._id.toString();
		if (!isSelfLike) {
			sendNewLikeNotification(post, post.author, req.user).catch(() => {});
		}
	}

	res.json({ likeCount, likedByViewer: true });
});

exports.unlikePost = asyncHandler(async (req, res) => {
	const postId = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(postId)) {
		return res.status(400).json({ msg: "ID de comentário inválido" });
	}

	const post = await Post.findById(postId);
	if (!post) {
		return res.status(404).json({ msg: "Comentário não encontrado" });
	}

	const result = await Like.deleteOne({ user: req.user._id, post: postId });

	let likeCount = post.likeCount || 0;
	if (result.deletedCount === 1) {
		const updated = await Post.findOneAndUpdate(
			{ _id: postId, likeCount: { $gt: 0 } },
			{ $inc: { likeCount: -1 } },
			{ new: true },
		).select("likeCount");
		if (updated) likeCount = updated.likeCount;
		else likeCount = 0;
	}

	res.json({ likeCount, likedByViewer: false });
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

	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		if (!post.parent) {
			// Top-level: cascade-delete replies + their new_reply notifications
			const replies = await Post.find({ parent: post._id }, "_id").session(
				session,
			);
			const replyIds = replies.map((r) => r._id);

			await cleanupPostNotifications([post._id, ...replyIds], session);

			await Like.deleteMany({
				post: { $in: [post._id, ...replyIds] },
			}).session(session);

			if (replyIds.length > 0) {
				await Post.deleteMany({ _id: { $in: replyIds } }).session(session);
			}
			await Post.findByIdAndDelete(post._id).session(session);
		} else {
			// Reply: clean up its notification, delete, decrement parent count
			await cleanupPostNotifications([post._id], session);

			await Like.deleteMany({ post: post._id }).session(session);

			await Post.findByIdAndDelete(post._id).session(session);
			await Post.findOneAndUpdate(
				{ _id: post.parent, replyCount: { $gt: 0 } },
				{ $inc: { replyCount: -1 } },
			).session(session);
		}

		await session.commitTransaction();
		res.json({ msg: "Comentário removido com sucesso" });
	} catch (err) {
		if (session.inTransaction()) await session.abortTransaction();
		throw err;
	} finally {
		session.endSession();
	}
});
