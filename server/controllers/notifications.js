const Notification = require("../models/Notification");
const asyncHandler = require("express-async-handler");
const Volume = require("../models/volume");
const Series = require("../models/Series");
const User = require("../models/User");
const Post = require("../models/Post");
const PendingReplyDigest = require("../models/PendingReplyDigest");

const { getVolumeCoverURL } = require("../Utils/getCoverFunctions");
const { sendEmail } = require("../Utils/sendEmail");
const UserNotificationStatus = require("../models/UserNotificationStatus");
const logger = require("../Utils/logger");

const LIKE_MILESTONES = [1, 5, 10, 25, 50, 100, 250, 500, 1000];
const isLikeMilestone = (count) => LIKE_MILESTONES.includes(count);
const REPLY_DIGEST_WINDOW_MIN = 5;

function othersPhrase(count) {
	return count === 1 ? "e outra pessoa" : `e outras ${count} pessoas`;
}

exports.setNotificationAsSeen = asyncHandler(async (req, res, next) => {

	const seenNotification = req.body.notification;
	await User.findOneAndUpdate(
		{ _id: req.user._id, "notifications._id": seenNotification },
		{ $set: { "notifications.$.seen": true } },
	);
	res.send({ msg: "Notificação marcada como lida" });
});

exports.setAllNotificationsAsSeen = asyncHandler(async (req, res, next) => {
	await User.updateOne(
		{ _id: req.user._id },
		{ $set: { "notifications.$[].seen": true } },
	);
	res.send({ msg: "Notificações marcadas como lidas" });
});

exports.getUserNotifications = asyncHandler(async (req, res, next) => {
	if (!req.isAuthenticated()) {
		return res.status(401).json({ msg: "Usuário deve estar logado" });
	}

	const { group, page } = req.query;

	if (!group) {
		const notifications = await getAllNotifications(req.user._id, {
			socialPage: 1,
			socialLimit: 10,
			mediaPage: 1,
			mediaLimit: 10,
			systemPage: 1,
			systemLimit: 10,
		});
		res.send(notifications);
	} else {
		const notifications = await getGroupNotifications(
			req.user._id,
			{
				page: page || 1,
				limit: 10,
			},
			group,
		);
		res.send(notifications);
	}
});
const populateAssociatedObject = [
	{
		$lookup: {
			from: "users",
			localField: "associatedObject",
			foreignField: "_id",
			pipeline: [{ $project: { username: 1, profileImageUrl: 1 } }],
			as: "userObj",
		},
	},
	{
		$lookup: {
			from: "volumes",
			localField: "associatedObject",
			foreignField: "_id",
			pipeline: [{ $project: { number: 1, serie: 1 } }],
			as: "volumeObj",
		},
	},
	{
		$lookup: {
			from: "series",
			localField: "associatedObject",
			foreignField: "_id",
			pipeline: [{ $project: { title: 1, coverImage: 1 } }],
			as: "seriesObj",
		},
	},
	{
		$addFields: {
			associatedObject: {
				$switch: {
					branches: [
						{
							case: { $eq: ["$objectType", "User"] },
							then: { $arrayElemAt: ["$userObj", 0] },
						},
						{
							case: { $eq: ["$objectType", "Volume"] },
							then: { $arrayElemAt: ["$volumeObj", 0] },
						},
						{
							case: { $eq: ["$objectType", "Series"] },
							then: { $arrayElemAt: ["$seriesObj", 0] },
						},
					],
					default: "$associatedObject",
				},
			},
		},
	},
	{ $project: { userObj: 0, volumeObj: 0, seriesObj: 0 } },
];

async function getAllNotifications(userId, paginationOptions) {
	const {
		socialPage = 1,
		socialLimit = 10,
		mediaPage = 1,
		mediaLimit = 10,
		systemPage = 1,
		systemLimit = 10,
	} = paginationOptions;

	const results = await User.aggregate([
		{ $match: { _id: userId } },
		{ $project: { notifications: 1 } },
		{ $unwind: "$notifications" },
		{
			$lookup: {
				from: "notifications",
				localField: "notifications.notification",
				foreignField: "_id",
				as: "notificationDetails",
			},
		},
		{ $unwind: "$notificationDetails" },
		{
			$addFields: {
				"notificationDetails.seen": "$notifications.seen",
				"notificationDetails.date": "$notifications.date",
				"notificationDetails.id": "$notifications._id",
			},
		},
		{ $replaceRoot: { newRoot: "$notificationDetails" } },
		{
			$facet: {
				social: [
					{ $match: { group: "social" } }, // New group filter
					{ $sort: { date: -1 } },
					{ $skip: (socialPage - 1) * socialLimit },
					{ $limit: socialLimit },
					...populateAssociatedObject,
				],
				media: [
					{ $match: { group: "media" } }, // Includes volumes AND deletions
					{ $sort: { date: -1 } },
					{ $skip: (mediaPage - 1) * mediaLimit },
					{ $limit: mediaLimit },
					...populateAssociatedObject,
				],
				system: [
					{ $match: { group: "system" } }, // New group filter
					{ $sort: { date: -1 } },
					{ $skip: (systemPage - 1) * systemLimit },
					{ $limit: systemLimit },
				],
			},
		},
	]);

	return results[0] || { social: [], media: [], system: [] };
}
async function getGroupNotifications(userId, paginationOptions, group) {
	const { page = 1, limit = 10 } = paginationOptions;

	const results = await User.aggregate([
		{ $match: { _id: userId } },
		{ $project: { notifications: 1 } },
		{ $unwind: "$notifications" },
		{
			$lookup: {
				from: "notifications",
				localField: "notifications.notification",
				foreignField: "_id",
				as: "notificationDetails",
			},
		},
		{ $unwind: "$notificationDetails" },
		{
			$addFields: {
				"notificationDetails.seen": "$notifications.seen",
				"notificationDetails.date": "$notifications.date",
				"notificationDetails.id": "$notifications._id",
			},
		},
		{ $replaceRoot: { newRoot: "$notificationDetails" } },

		{ $match: { group: group } },

		{ $sort: { date: -1 } },
		{ $skip: (page - 1) * limit },
		{ $limit: limit },
		...populateAssociatedObject,
	]);

	return results;
}
exports.sendSiteNewsNotification = async (updatesList) => {
	const notification = await createSiteNewsNotification(updatesList);
	const users = await User.find({}).select("_id username");
	for (const user of users) {
		try {
			await sendNotification(notification, user._id);
		} catch (err) {
			logger.error(`Failed to send to user ${user.username}:`, err.message);
		}
	}
};
exports.adminSendPatchNotes = asyncHandler(async (req, res, next) => {
	const { updatesList } = req.body;
	exports.sendSiteNewsNotification(updatesList).catch((err) => {
		console.error("Fatal error in notification background process:", err);
	});
	res.send({ msg: "Processo de envio iniciado em segundo plano." });
});
async function createSiteNewsNotification(updatesList) {
	const newNotification = new Notification({
		group: "system",
		eventKey: "site_update",
		text: "O Manga Shelf foi atualizado. Veja as novidades",
		imageUrl: `/android-chrome-192x192.png`,
		details: updatesList,
	});
	await newNotification.save();
	return newNotification;
}
async function createNewVolumeNotification(newVolume) {
	if (!newVolume) return;

	const existingNotification = await Notification.findOne({
		eventKey: "new_volume",
		associatedObject: newVolume._id,
		objectType: "Volume",
	});

	if (existingNotification) return existingNotification;

	const newNotification = new Notification({
		group: "media",
		eventKey: "new_volume",
		text: `Um novo volume de [[${newVolume.serie.title}|/series/${newVolume.serie._id}]] foi adicionado ao site.`,
		imageUrl: getVolumeCoverURL(
			newVolume.serie,
			newVolume.number,
			newVolume.isVariant,
			newVolume.variantNumber,
		),
		associatedObject: newVolume._id,
		objectType: "Volume",
	});

	await newNotification.save();
	return newNotification;
}
exports.createPendingVolumeNotification = async (newVolume) => {
	const notification = await createNewVolumeNotification(newVolume);
	if (!notification) return;

	const users = await User.find({
		userList: {
			$elemMatch: {
				Series: newVolume.serie,
				status: { $ne: "Dropped" },
			},
		},
	}).select("settings");
	if (users.length === 0) return;

	const pendingDocs = [];
	for (const user of users) {
		const sets = user.settings.notifications;
		const isMediaEnabled = sets.allow && sets.groups.media;

		if (isMediaEnabled && (sets.site || sets.email)) {
			pendingDocs.push({
				user: user._id,
				notification: notification._id,
				siteStatus: sets.site ? "pending" : "disabled",
				emailStatus: sets.email ? "pending" : "disabled",
			});
		}
	}

	if (pendingDocs.length > 0) {
		await UserNotificationStatus.insertMany(pendingDocs);
	}
};

async function createFollowingNotification(userId) {
	const [existingNotification, user] = await Promise.all([
		Notification.findOne({
			eventKey: "new_follower",
			associatedObject: userId,
			objectType: "User",
		}),
		User.findById(userId),
	]);

	if (existingNotification) return existingNotification;
	if (!user) return;

	const newNotification = new Notification({
		group: "social",
		eventKey: "new_follower",
		text: `[[${user.username}|/user/${user.username}]] Começou a te seguir`,
		imageUrl: user.profileImageUrl,
		associatedObject: userId,
		objectType: "User",
	});
	await newNotification.save();
	return newNotification;
}
exports.sendNewLikeNotification = async (post, recipientId, liker, likeCount) => {
	try {
		if (!isLikeMilestone(likeCount)) return;

		const likerLink = `[[${liker.username}|/user/${liker.username}]]`;
		const series = await Series.findById(post.series).select("title");
		const seriesTitle = series ? series.title : "";
		const commentsPath = post.volume
			? `/volume/${post.volume}/comments`
			: `/series/${post.series}/comments`;
		const postLink = `[[${post.isReview ? "sua review" : "seu comentário"}|/post/${post._id}]]`;

		const text = likeCount === 1
			? `${likerLink} curtiu ${postLink} em [[${seriesTitle}|${commentsPath}]]`
			: `${likerLink} ${othersPhrase(likeCount - 1)} curtiram ${postLink} em [[${seriesTitle}|${commentsPath}]]`;

		let notification = await Notification.findOne({
			eventKey: "new_like",
			associatedObject: post._id,
			objectType: "Post",
		});

		if (notification) {
			notification.text = text;
			notification.imageUrl = liker.profileImageUrl || null;
			await notification.save();
		} else {
			notification = await Notification.create({
				group: "social",
				eventKey: "new_like",
				text,
				imageUrl: liker.profileImageUrl || null,
				associatedObject: post._id,
				objectType: "Post",
			});
		}

		await reAlertSiteNotification(notification, recipientId);
	} catch (err) {
		logger.error("Failed to send new_like notification:", err.message);
	}
};

exports.sendPostHiddenNotification = async (post) => {
	try {
		const series = await Series.findById(post.series).select("title");
		const seriesTitle = series ? series.title : "";

		const text = `[[Seu comentário|/post/${post._id}]] em ${seriesTitle} foi denunciado por "Ódio ou discurso abusivo" e por isso está oculto e em análise`;

		let notification = await Notification.findOne({
			eventKey: "post_hidden",
			associatedObject: post._id,
			objectType: "Post",
		});

		if (!notification) {
			notification = await Notification.create({
				group: "system",
				eventKey: "post_hidden",
				text,
				imageUrl: `/android-chrome-192x192.png`,
				associatedObject: post._id,
				objectType: "Post",
			});
		}

		await sendSiteOnlyNotification(notification, post.author);
	} catch (err) {
		logger.error("Failed to send post_hidden notification:", err.message);
	}
};

exports.sendNewReplyNotification = async (reply, recipientId, topLevelParentId) => {
	try {
		const replier = await User.findById(reply.author).select("username");
		if (!replier) return;

		const existing = await PendingReplyDigest.findOne({
			recipient: recipientId,
			topLevelComment: topLevelParentId,
		});

		if (existing) {
			const alreadyIncluded = existing.repliers.some(
				(r) => r.user.toString() === replier._id.toString(),
			);
			if (!alreadyIncluded) {
				existing.repliers.push({ user: replier._id, username: replier.username });
				await existing.save();
			}
		} else {
			await PendingReplyDigest.create({
				recipient: recipientId,
				topLevelComment: topLevelParentId,
				flushAfter: new Date(Date.now() + REPLY_DIGEST_WINDOW_MIN * 60 * 1000),
				repliers: [{ user: replier._id, username: replier.username }],
			});
		}
	} catch (err) {
		logger.error("Failed to enqueue new_reply digest:", err.message);
	}
};

let replyDigestRunning = false;

exports.dispatchReplyDigests = async () => {
	if (replyDigestRunning) return;
	replyDigestRunning = true;
	try {
		await runReplyDigests();
	} finally {
		replyDigestRunning = false;
	}
};

async function runReplyDigests() {
	const pending = await PendingReplyDigest.find({
		flushAfter: { $lte: new Date() },
	});

	for (const digest of pending) {
		try {
			const topLevelComment = await Post.findById(
				digest.topLevelComment,
			).select("series volume isReview");

			if (!topLevelComment) {
				await PendingReplyDigest.deleteOne({ _id: digest._id });
				continue;
			}

			const series = await Series.findById(topLevelComment.series).select(
				"title",
			);
			const seriesTitle = series ? series.title : "";
			const commentsPath = topLevelComment.volume
				? `/volume/${topLevelComment.volume}/comments`
				: `/series/${topLevelComment.series}/comments`;
			const postLink = `[[${topLevelComment.isReview ? "sua review" : "seu comentário"}|/post/${topLevelComment._id}]]`;

			const [first, ...rest] = digest.repliers;
			const firstLink = `[[${first.username}|/user/${first.username}]]`;
			const text = rest.length > 0
				? `${firstLink} ${othersPhrase(rest.length)} responderam ${postLink} em [[${seriesTitle}|${commentsPath}]]`
				: `${firstLink} respondeu ${postLink} em [[${seriesTitle}|${commentsPath}]]`;

			const firstReplier = await User.findById(first.user).select(
				"profileImageUrl",
			);

			const notification = await Notification.create({
				group: "social",
				eventKey: "new_reply",
				text,
				imageUrl: firstReplier?.profileImageUrl || null,
				associatedObject: topLevelComment._id,
				objectType: "Post",
			});

			await sendSiteOnlyNotification(notification, digest.recipient);

			await PendingReplyDigest.deleteOne({ _id: digest._id });
		} catch (err) {
			logger.error("Failed to dispatch reply digest:", err.message);
		}
	}
}

exports.sendNewMentionNotification = async (
	reply,
	recipientId,
	mentioner,
	seriesTitle,
	seriesId,
	volumeId,
) => {
	try {
		const commentsPath = volumeId
			? `/volume/${volumeId}/comments`
			: `/series/${seriesId}/comments`;
		const mentionerLink = `[[${mentioner.username}|/user/${mentioner.username}]]`;
		const text = `${mentionerLink} mencionou você em [[um comentário|/post/${reply._id}]] sobre [[${seriesTitle}|${commentsPath}]]`;

		const notification = await Notification.create({
			group: "social",
			eventKey: "new_mention",
			text,
			imageUrl: mentioner.profileImageUrl || null,
			associatedObject: reply._id,
			objectType: "Post",
		});

		await sendSiteOnlyNotification(notification, recipientId);
	} catch (err) {
		logger.error("Failed to send new_mention notification:", err.message);
	}
};

exports.sendNewFollowerNotification = async (followerID, followedID) => {
	const notification = await createFollowingNotification(followerID);
	const cooldownPeriod = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

	const existingStatus = await UserNotificationStatus.findOne({
		user: followedID,
		notification: notification._id,
		createdAt: { $gte: cooldownPeriod },
	});

	if (existingStatus) {
		return;
	}

	await UserNotificationStatus.create({
		user: followedID,
		notification: notification._id,
		siteStatus: "sent",
		emailStatus: "disabled",
	});

	return sendSiteOnlyNotification(notification, followedID);
};
async function checkNotificationSettings(userId, group) {
	const user = await User.findById(userId).select("settings");
	if (!user || !user.settings.notifications.allow) {
		return { allowEmail: false, allowSite: false };
	}

	const settings = user.settings.notifications;
	const isGroupEnabled = settings.groups[group] !== false;

	return {
		allowEmail: settings.email && isGroupEnabled,
		allowSite: settings.site && isGroupEnabled,
	};
}
const sendEmailNotification = async (notification, targetUserId, dataList) => {
	const targetUser = await User.findById(targetUserId);
	if (!targetUser) return;

	if (notification.group === "media") {
		if (notification.eventKey === "new_volume" && dataList) {
			const attachments = dataList.map((volume, id) => {
				const cover = getVolumeCoverURL(
					volume.serie,
					volume.number,
					volume.isVariant,
					volume.variantNumber,
				);
				return {
					filename: cover,
					path: `${process.env.SITE_DOMAIN}/images/medium/${cover}`,
					contentDisposition: "inline",
					cid: `img${id + 1}.webp`,
					contentType: "image/webp",
				};
			});

			await sendEmail(
				targetUser.email,
				"Novos volumes Manga Shelf",
				"newVolumes",
				{
					username: targetUser.username,
					volumes: dataList,
				},
				attachments,
			);
		} else if (notification.eventKey.endsWith("_deleted")) {
			await sendEmail(
				targetUser.email,
				"Item removido do Manga Shelf",
				"mediaDeletion",
				{
					username: targetUser.username,
					notification,
				},
			);
		}
	}

	if (notification.group === "system") {
		await sendEmail(
			targetUser.email,
			"Nova atualização no Manga Shelf",
			"siteUpdatesEmail",
			{
				username: targetUser.username,
				notification,
			},
		);
	}

	return;
};
async function sendSiteOnlyNotification(notification, targetUserId) {
	const { allowSite } = await checkNotificationSettings(
		targetUserId,
		notification.group,
	);
	if (allowSite) {
		await sendSiteNotification(notification._id, targetUserId);
	}
}

async function reAlertSiteNotification(notification, targetUserId) {
	const { allowSite } = await checkNotificationSettings(
		targetUserId,
		notification.group,
	);
	if (!allowSite) return;

	const result = await User.updateOne(
		{ _id: targetUserId, "notifications.notification": notification._id },
		{
			$set: {
				"notifications.$.seen": false,
				"notifications.$.date": new Date(),
			},
		},
	);

	if (result.matchedCount === 0) {
		await User.findByIdAndUpdate(targetUserId, {
			$push: {
				notifications: {
					notification: notification._id,
					seen: false,
					date: new Date(),
				},
			},
		});
	}
}

const sendSiteNotification = async (notificationId, targetUserId) => {
	await User.findByIdAndUpdate(
		targetUserId,
		{ $push: { notifications: { notification: notificationId } } },
		{ new: true },
	);
	return;
};
async function sendNotification(notification, targetUserId, dataList) {
	const { allowEmail, allowSite } = await checkNotificationSettings(
		targetUserId,
		notification.group,
	);

	const result = {
		site: {
			status: allowSite ? "pending" : "disabled",
			deliveredNotificationIds: [],
		},
		email: { status: allowEmail ? "pending" : "disabled" },
		error: null,
	};

	if (allowSite) {
		try {
			if (
				dataList &&
				dataList.length > 0 &&
				notification.eventKey === "new_volume"
			) {
				for (const item of dataList) {
					const notificationId = item.notificationId || notification._id;
					if (!item.siteAlreadySent) {
						await sendSiteNotification(notificationId, targetUserId);
					}
					result.site.deliveredNotificationIds.push(notificationId);
				}
			} else {
				await sendSiteNotification(notification._id, targetUserId);
				result.site.deliveredNotificationIds.push(notification._id);
			}
			result.site.status = "sent";
		} catch (err) {
			logger.error("Failed to deliver site notification:", err.message);
			result.site.status = "failed";
			result.error = err;
		}
	}

	if (allowEmail) {
		try {
			if (notification.eventKey === "new_volume") {
				await sendEmailNotification(notification, targetUserId, dataList);
			} else {
				await sendEmailNotification(notification, targetUserId);
			}
			result.email.status = "sent";
		} catch (err) {
			logger.error("Failed to deliver email notification:", err.message);
			result.email.status = "failed";
			if (!result.error) result.error = err;
		}
	}

	return result;
}

async function markDeliveryStatus(statuses, result) {
	const statusIds = statuses.map((s) => s._id);

	if (result.site.status === "sent") {
		const deliveredIds = result.site.deliveredNotificationIds.map((id) =>
			id.toString(),
		);
		const matchedIds = statuses
			.filter((s) => deliveredIds.includes(s.notification._id.toString()))
			.map((s) => s._id);
		if (matchedIds.length > 0) {
			await UserNotificationStatus.updateMany(
				{ _id: { $in: matchedIds }, siteStatus: "pending" },
				{ $set: { siteStatus: "sent" } },
			);
		}
	} else if (result.site.status === "disabled") {
		await UserNotificationStatus.updateMany(
			{ _id: { $in: statusIds }, siteStatus: "pending" },
			{ $set: { siteStatus: "disabled" } },
		);
	}

	if (result.email.status === "sent") {
		await UserNotificationStatus.updateMany(
			{ _id: { $in: statusIds }, emailStatus: "pending" },
			{ $set: { emailStatus: "sent" } },
		);
	} else if (result.email.status === "disabled") {
		await UserNotificationStatus.updateMany(
			{ _id: { $in: statusIds }, emailStatus: "pending" },
			{ $set: { emailStatus: "disabled" } },
		);
	}
}

exports.processPendingNotifications = async (
	eventKeyFilter = null,
	isBatch = false,
) => {
	const query = {
		$or: [{ emailStatus: "pending" }, { siteStatus: "pending" }],
	};

	const matchStage = eventKeyFilter ? { eventKey: eventKeyFilter } : {};

	const pending = await UserNotificationStatus.find(query)
		.populate({
			path: "notification",
			match: matchStage,
		})
		.populate("user");

	const validPending = pending.filter((s) => s.notification);
	if (validPending.length === 0) return 0;

	const userGroups = validPending.reduce((acc, status) => {
		const userId = status.user._id.toString();
		if (!acc[userId]) acc[userId] = [];
		acc[userId].push(status);
		return acc;
	}, {});

	let failedCount = 0;

	for (const userId in userGroups) {
		const statuses = userGroups[userId];
		const user = statuses[0].user;

		try {
			if (isBatch) {
				const dataList = statuses.map((s) => s.notification.associatedObject);
				const result = await sendNotification(
					statuses[0].notification,
					user._id,
					dataList,
				);
				await markDeliveryStatus(statuses, result);
				if (result.site.status === "failed" || result.email.status === "failed") {
					failedCount++;
				}
			} else {
				for (const status of statuses) {
					const result = await sendNotification(status.notification, user._id);
					await markDeliveryStatus([status], result);
					if (result.site.status === "failed" || result.email.status === "failed") {
						failedCount++;
					}
				}
			}
		} catch (err) {
			failedCount++;
			logger.error(
				`Pending notification dispatch failed for user ${user.username}:`,
				err.message,
			);
		}
	}

	return failedCount;
};

exports.createDeletionNotification = async (
	itemData,
	objectType,
	reason,
	session,
) => {
	let notificationText = "";
	if (objectType === "Series") {
		notificationText = `A obra **${itemData.title}** foi removida do site.`;
	} else {
		notificationText = `Um volume que você possuía de [[${itemData.title}|/series/${itemData.linkId}]] foi removido do site.`;
	}
	const newNotification = new Notification({
		group: "media",
		eventKey: `${objectType.toLowerCase()}_deleted`,
		text: notificationText,
		details: [`Motivo: ${reason}`],
		objectType: objectType,
	});

	await newNotification.save({ session });
	return newNotification;
};
exports.notifyDeletion = async (session, users, itemData, type, reason) => {
	const deletionNotification = await exports.createDeletionNotification(
		itemData,
		type,
		reason,
		session,
	);

	const statusDocs = users.map((user) => {
		const sets = user.settings?.notifications;
		const isAllowed = sets?.allow !== false && sets?.groups?.media !== false;

		return {
			user: user._id,
			notification: deletionNotification._id,
			siteStatus: isAllowed && sets?.site !== false ? "pending" : "disabled",
			emailStatus: isAllowed && sets?.email !== false ? "pending" : "disabled",
		};
	});

	if (statusDocs.length > 0) {
		await UserNotificationStatus.insertMany(statusDocs, { session });
	}
};
exports.sendEmailNotification = sendEmailNotification;
exports.sendSiteNotification = sendSiteNotification;
exports.sendNotification = sendNotification;
exports.markDeliveryStatus = markDeliveryStatus;