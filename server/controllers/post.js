const Post = require("../models/Post");
const Like = require("../models/Like");
const Rating = require("../models/Rating");
const Series = require("../models/Series");
const Volume = require("../models/volume");
const Notification = require("../models/Notification");
const UserNotificationStatus = require("../models/UserNotificationStatus");
const PendingReplyDigest = require("../models/PendingReplyDigest");
const PostReport = require("../models/PostReport");
const User = require("../models/User");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { getSeriesCoverURL, getVolumeCoverURL } = require("../Utils/getCoverFunctions");
const {
	sendNewReplyNotification,
	sendNewLikeNotification,
	sendNewMentionNotification,
} = require("./notifications");

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
	image: { $ifNull: ["$image", null] },
	isSpoiler: { $ifNull: ["$isSpoiler", false] },
	isAdultContent: { $ifNull: ["$isAdultContent", false] },
	editedAt: { $ifNull: ["$editedAt", null] },
	isHidden: { $ifNull: ["$isHidden", false] },
};

function withholdHidden(post) {
	if (post.isHidden) {
		post.text = null;
		post.image = null;
	}
	return post;
}

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

const reviewScoreLookupStages = [
	{
		$lookup: {
			from: "ratings",
			let: { author: "$author", series: "$series", volume: "$volume" },
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [
								{ $eq: ["$user", "$$author"] },
								{ $eq: ["$series", "$$series"] },
								{ $eq: ["$volume", "$$volume"] },
							],
						},
					},
				},
				{ $limit: 1 },
			],
			as: "ratingArr",
		},
	},
	{
		$addFields: {
			reviewScore: { $arrayElemAt: ["$ratingArr.score", 0] },
		},
	},
	{ $unset: "ratingArr" },
];

function gateImage(post, viewerAllowsAdult, viewerId) {
	const isAuthor =
		viewerId &&
		post.author?._id &&
		post.author._id.toString() === viewerId.toString();
	if (post.image && post.isAdultContent && !viewerAllowsAdult && !isAuthor)
		post.image = null;
	return post;
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

function parseMentionedUsernames(text) {
	if (!text || !text.includes("@")) return [];
	const matches = text.match(/@([A-Za-z0-9]{3,16})/g) || [];
	return [...new Set(matches.map((m) => m.slice(1)))];
}

async function resolveMentionRecipients({
	text,
	topLevelParentId,
	replyTargetId,
	mentionerId,
}) {
	const usernames = parseMentionedUsernames(text);
	if (usernames.length === 0) return [];

	const [participantIds, mentionedUsers] = await Promise.all([
		Post.distinct("author", {
			$or: [{ _id: topLevelParentId }, { parent: topLevelParentId }],
		}),
		User.find({
			username: {
				$in: usernames.map((name) => new RegExp(`^${name}$`, "i")),
			},
		}).select("_id"),
	]);

	const participantSet = new Set(participantIds.map((id) => id.toString()));
	const excludeSet = new Set([
		mentionerId.toString(),
		replyTargetId ? replyTargetId.toString() : null,
	]);

	const recipients = new Set();
	for (const mentionedUser of mentionedUsers) {
		const id = mentionedUser._id.toString();
		if (participantSet.has(id) && !excludeSet.has(id)) {
			recipients.add(id);
		}
	}
	return [...recipients];
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
	const {
		seriesId,
		volumeId,
		text,
		parentId,
		isReview: isReviewFlag,
		isSpoiler: isSpoilerFlag,
		isAdultContent: isAdultContentFlag,
	} = req.body;

	const series = await Series.findById(seriesId).select("_id title");
	if (!series) {
		return res.status(404).json({ msg: "Obra não encontrada" });
	}

	let processedImage = null;
	if (req.file) {
		try {
			processedImage = await sharp(req.file.buffer)
				.rotate()
				.webp({ quality: 80 })
				.toBuffer();
		} catch (err) {
			return res.status(400).json({ msg: "Imagem inválida" });
		}
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

	const isReview = isReviewFlag === true && !parentId;
	const isSpoiler = isSpoilerFlag === true;
	const isAdultContent = isAdultContentFlag === true;

	if (isReview) {
		const rating = await Rating.findOne({
			user: req.user._id,
			series: seriesId,
			volume: volumeId || null,
		});
		if (!rating) {
			return res.status(400).json({ msg: "Avalie a obra antes de publicar uma review" });
		}
	}

	let post;
	try {
		post = await Post.create({
			author: req.user._id,
			series: seriesId,
			volume: volumeId || null,
			text,
			parent: topLevelParentId,
			isReview,
			isSpoiler,
			isAdultContent,
		});
	} catch (err) {
		if (err.code === 11000 && isReview) {
			return res.status(409).json({ msg: "Você já avaliou esta obra" });
		}
		throw err;
	}

	if (processedImage) {
		const folderPath = path.resolve("public/images/posts");
		if (!fs.existsSync(folderPath)) {
			fs.mkdirSync(folderPath, { recursive: true });
		}
		fs.writeFileSync(path.join(folderPath, `${post._id}.webp`), processedImage);
		post.image = `/images/posts/${post._id}.webp`;
		await post.save();
	}

	if (topLevelParentId) {
		await Post.findByIdAndUpdate(topLevelParentId, { $inc: { replyCount: 1 } });

		const isSelfReply =
			notifyRecipientId.toString() === req.user._id.toString();
		if (!isSelfReply) {
			sendNewReplyNotification(
				post,
				notifyRecipientId,
				topLevelParentId,
			).catch(() => {});
		}

		if (text.includes("@")) {
			(async () => {
				const recipients = await resolveMentionRecipients({
					text,
					topLevelParentId,
					replyTargetId: notifyRecipientId,
					mentionerId: req.user._id,
				});
				for (const recipientId of recipients) {
					await sendNewMentionNotification(
						post,
						recipientId,
						req.user,
						series.title,
						seriesId,
						volumeId || null,
					);
				}
			})().catch(() => {});
		}
	}

	const msg = isReview ? "Review publicada com sucesso" : "Comentário publicado com sucesso";
	res.status(201).json({ msg, post });
});

exports.editPost = asyncHandler(async (req, res) => {
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

	if (post.isHidden) {
		return res
			.status(403)
			.json({ msg: "Comentário em análise não pode ser editado" });
	}

	const {
		text,
		isSpoiler: isSpoilerFlag,
		isAdultContent: isAdultContentFlag,
		removeImage,
	} = req.body;

	let processedImage = null;
	if (req.file) {
		try {
			processedImage = await sharp(req.file.buffer)
				.rotate()
				.webp({ quality: 80 })
				.toBuffer();
		} catch (err) {
			return res.status(400).json({ msg: "Imagem inválida" });
		}
	}

	post.text = text;
	post.isSpoiler = isSpoilerFlag === true;
	post.isAdultContent = isAdultContentFlag === true;

	if (processedImage) {
		const folderPath = path.resolve("public/images/posts");
		if (!fs.existsSync(folderPath)) {
			fs.mkdirSync(folderPath, { recursive: true });
		}
		fs.writeFileSync(path.join(folderPath, `${post._id}.webp`), processedImage);
		post.image = `/images/posts/${post._id}.webp`;
	} else if (removeImage && post.image) {
		const filePath = path.resolve(`public${post.image}`);
		if (fs.existsSync(filePath)) {
			try {
				fs.unlinkSync(filePath);
			} catch (err) {
				console.error("Error deleting post image:", err);
			}
		}
		post.image = null;
	}

	post.editedAt = new Date();
	await post.save();

	res.json({ msg: "Comentário atualizado com sucesso", post });
});

exports.getPosts = asyncHandler(async (req, res) => {
	const { seriesId, volumeId, sort, type } = req.query;
	if (!mongoose.Types.ObjectId.isValid(seriesId)) {
		return res.status(400).json({ msg: "ID de obra inválido" });
	}
	if (volumeId && !mongoose.Types.ObjectId.isValid(volumeId)) {
		return res.status(400).json({ msg: "ID de volume inválido" });
	}

	const viewerAllowsAdult = !!req.user?.allowAdult;

	const page = parseInt(req.query.p) || 1;
	const skip = POSTS_PER_PAGE * (page - 1);

	const sortStage = sort === "recent"
		? { createdAt: -1 }
		: { likeCount: -1, createdAt: -1 };

	const isReviewType = type === "review";
	const viewerId = req.user ? req.user._id : null;
	const viewerLikeStages = makeViewerLikeStages(viewerId);

	const matchStage = {
		series: new mongoose.Types.ObjectId(seriesId),
		volume: volumeId ? new mongoose.Types.ObjectId(volumeId) : null,
		parent: null,
		...(isReviewType ? { isReview: true } : { isReview: { $ne: true } }),
	};

	const ratingLookupStages = isReviewType ? reviewScoreLookupStages : [];

	const reviewProjection = isReviewType ? { isReview: 1, reviewScore: 1 } : {};

	const posts = await Post.aggregate([
		{ $match: matchStage },
		{ $sort: sortStage },
		{ $skip: skip },
		{ $limit: POSTS_PER_PAGE },
		...attachAuthorStages,
		...viewerLikeStages,
		...ratingLookupStages,
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
				...reviewProjection,
				replyCount: 1,
				replyPreview: { $arrayElemAt: ["$replyPreviewArr", 0] },
			},
		},
	]);

	posts.forEach((post) => {
		gateImage(post, viewerAllowsAdult, viewerId);
		withholdHidden(post);
		if (post.replyPreview) {
			gateImage(post.replyPreview, viewerAllowsAdult, viewerId);
			withholdHidden(post.replyPreview);
		}
	});

	res.json(posts);
});

exports.getUserPosts = asyncHandler(async (req, res) => {
	const { username } = req.params;
	const { sort, type } = req.query;

	const targetUser = await User.findOne({ username }).select("_id");
	if (!targetUser) {
		return res.status(404).json({ msg: "Usuário não encontrado" });
	}

	const viewerAllowsAdult = !!req.user?.allowAdult;
	const viewerId = req.user ? req.user._id : null;
	const viewerLikeStages = makeViewerLikeStages(viewerId);

	const page = parseInt(req.query.p) || 1;
	const skip = POSTS_PER_PAGE * (page - 1);

	const sortStage = sort === "recent"
		? { createdAt: -1 }
		: { likeCount: -1, createdAt: -1 };

	const isReviewType = type === "review";

	const matchStage = {
		author: targetUser._id,
		parent: null,
		...(isReviewType ? { isReview: true } : { isReview: { $ne: true } }),
	};

	const ratingLookupStages = isReviewType ? reviewScoreLookupStages : [];
	const reviewProjection = isReviewType ? { isReview: 1, reviewScore: 1 } : {};

	const posts = await Post.aggregate([
		{ $match: matchStage },
		{ $sort: sortStage },
		{ $skip: skip },
		{ $limit: POSTS_PER_PAGE },
		...attachAuthorStages,
		...viewerLikeStages,
		...ratingLookupStages,
		{
			$lookup: {
				from: "series",
				localField: "series",
				foreignField: "_id",
				as: "seriesInfo",
				pipeline: [{ $project: { title: 1 } }],
			},
		},
		{ $unwind: "$seriesInfo" },
		{
			$lookup: {
				from: "volumes",
				localField: "volume",
				foreignField: "_id",
				as: "volumeInfo",
				pipeline: [{ $project: { number: 1 } }],
			},
		},
		{
			$project: {
				...basePostProjection,
				...reviewProjection,
				replyCount: 1,
				context: {
					seriesId: "$series",
					seriesTitle: "$seriesInfo.title",
					volumeId: "$volume",
					volumeNumber: { $arrayElemAt: ["$volumeInfo.number", 0] },
				},
			},
		},
	]);

	posts.forEach((post) => {
		gateImage(post, viewerAllowsAdult, viewerId);
		withholdHidden(post);
	});

	res.json(posts);
});

exports.getReplies = asyncHandler(async (req, res) => {
	const postId = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(postId)) {
		return res.status(400).json({ msg: "ID de comentário inválido" });
	}

	const page = parseInt(req.query.p) || 1;
	const skip = REPLIES_PER_PAGE * (page - 1);

	const viewerAllowsAdult = !!req.user?.allowAdult;
	const viewerId = req.user ? req.user._id : null;

	const viewerLikeStages = makeViewerLikeStages(viewerId);

	const replies = await Post.aggregate([
		{ $match: { parent: new mongoose.Types.ObjectId(postId) } },
		{ $sort: { createdAt: 1 } },
		{ $skip: skip },
		{ $limit: REPLIES_PER_PAGE },
		...attachAuthorStages,
		...viewerLikeStages,
		{ $project: basePostProjection },
	]);

	replies.forEach((reply) => {
		gateImage(reply, viewerAllowsAdult, viewerId);
		withholdHidden(reply);
	});

	res.json(replies);
});

exports.getPostThread = asyncHandler(async (req, res) => {
	const postId = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(postId)) {
		return res.status(400).json({ msg: "ID de comentário inválido" });
	}

	const requestedPost = await Post.findById(postId).select("parent");
	if (!requestedPost) {
		return res.status(404).json({ msg: "Esse comentário não existe mais" });
	}

	const highlightId = requestedPost._id;
	const topLevelId = requestedPost.parent || requestedPost._id;

	const topLevelDoc = await Post.findById(topLevelId).select(
		"series volume isReview",
	);
	if (!topLevelDoc) {
		return res.status(404).json({ msg: "Esse comentário não existe mais" });
	}

	const viewerAllowsAdult = !!req.user?.allowAdult;
	const viewerId = req.user ? req.user._id : null;
	const viewerLikeStages = makeViewerLikeStages(viewerId);

	const [topLevel] = await Post.aggregate([
		{ $match: { _id: topLevelId } },
		...attachAuthorStages,
		...viewerLikeStages,
		...(topLevelDoc.isReview ? reviewScoreLookupStages : []),
		{
			$project: {
				...basePostProjection,
				replyCount: 1,
				...(topLevelDoc.isReview ? { isReview: 1, reviewScore: 1 } : {}),
			},
		},
	]);

	gateImage(topLevel, viewerAllowsAdult, viewerId);
	withholdHidden(topLevel);

	const replies = await Post.aggregate([
		{ $match: { parent: topLevelId } },
		{ $sort: { createdAt: 1 } },
		...attachAuthorStages,
		...viewerLikeStages,
		{ $project: basePostProjection },
	]);

	replies.forEach((reply) => {
		gateImage(reply, viewerAllowsAdult, viewerId);
		withholdHidden(reply);
	});

	const series = await Series.findById(topLevelDoc.series).select("title isAdult");
	if (!series) {
		return res.status(404).json({ msg: "Esse comentário não existe mais" });
	}

	const hideCover = series.isAdult && !viewerAllowsAdult;

	let volumeNumber = null;
	let coverFilename = hideCover ? null : getSeriesCoverURL(series);
	if (topLevelDoc.volume) {
		const volume = await Volume.findById(topLevelDoc.volume).select(
			"number isVariant variantNumber",
		);
		if (!volume) {
			return res.status(404).json({ msg: "Esse comentário não existe mais" });
		}
		volumeNumber = volume.number;
		coverFilename = hideCover
			? null
			: getVolumeCoverURL(
					series,
					volume.number,
					volume.isVariant,
					volume.variantNumber,
				);
	}

	const context = {
		seriesId: topLevelDoc.series,
		seriesTitle: series.title,
		isAdult: series.isAdult,
		volumeId: topLevelDoc.volume,
		volumeNumber,
		coverFilename,
	};

	res.json({ topLevel, replies, highlightId, context });
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
			sendNewLikeNotification(post, post.author, req.user, likeCount).catch(() => {});
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

async function deletePostCascade(post, session) {
	const imagePaths = [];
	if (post.image) imagePaths.push(post.image);

	if (!post.parent) {
		const replies = await Post.find(
			{ parent: post._id },
			"_id image",
		).session(session);
		const replyIds = replies.map((r) => r._id);
		replies.forEach((r) => {
			if (r.image) imagePaths.push(r.image);
		});

		await cleanupPostNotifications([post._id, ...replyIds], session);
		await PendingReplyDigest.deleteOne({ topLevelComment: post._id }).session(
			session,
		);

		await Like.deleteMany({
			post: { $in: [post._id, ...replyIds] },
		}).session(session);

		if (replyIds.length > 0) {
			await Post.deleteMany({ _id: { $in: replyIds } }).session(session);
		}
		await Post.findByIdAndDelete(post._id).session(session);
	} else {
		await cleanupPostNotifications([post._id], session);
		await PendingReplyDigest.deleteOne({
			topLevelComment: post.parent,
		}).session(session);

		await Like.deleteMany({ post: post._id }).session(session);

		await Post.findByIdAndDelete(post._id).session(session);
		await Post.findOneAndUpdate(
			{ _id: post.parent, replyCount: { $gt: 0 } },
			{ $inc: { replyCount: -1 } },
		).session(session);
	}

	return imagePaths;
}
exports.deletePostCascade = deletePostCascade;

function unlinkImages(imagePaths) {
	imagePaths.forEach((image) => {
		const filePath = path.resolve(`public${image}`);
		if (fs.existsSync(filePath)) {
			try {
				fs.unlinkSync(filePath);
			} catch (err) {
				console.error("Error deleting post image:", err);
			}
		}
	});
}
exports.unlinkImages = unlinkImages;

async function deletePostsForTarget(postMatch, session) {
	const posts = await Post.find(postMatch, "_id image parent").session(session);
	if (posts.length === 0) return [];

	const postIds = posts.map((p) => p._id);
	const topLevelIds = posts.filter((p) => !p.parent).map((p) => p._id);
	const imagePaths = posts.filter((p) => p.image).map((p) => p.image);

	await cleanupPostNotifications(postIds, session);
	if (topLevelIds.length > 0) {
		await PendingReplyDigest.deleteMany({
			topLevelComment: { $in: topLevelIds },
		}).session(session);
	}
	await Like.deleteMany({ post: { $in: postIds } }).session(session);
	await PostReport.updateMany(
		{ post: { $in: postIds }, status: "Pendente" },
		{ $set: { status: "Resolvido", resolution: "target-deleted" } },
	).session(session);
	await Post.deleteMany({ _id: { $in: postIds } }).session(session);

	return imagePaths;
}
exports.deletePostsForTarget = deletePostsForTarget;

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
		const imagePaths = await deletePostCascade(post, session);
		await session.commitTransaction();

		unlinkImages(imagePaths);

		res.json({ msg: "Comentário removido com sucesso" });
	} catch (err) {
		if (session.inTransaction()) await session.abortTransaction();
		throw err;
	} finally {
		session.endSession();
	}
});
