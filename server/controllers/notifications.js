const Notification = require("../models/Notification");
const asyncHandler = require("express-async-handler");
const Volume = require("../models/volume");
const User = require("../models/User");

const { getVolumeCoverURL } = require("../Utils/getCoverFunctions");
const { sendEmail } = require("../Utils/sendEmail");
const UserNotificationStatus = require("../models/UserNotificationStatus");
const logger = require("../Utils/logger");

exports.setNotificationAsSeen = asyncHandler(async (req, res, next) => {
	if (!req.isAuthenticated()) {
		return res.status(401).json({ msg: "Usuário deve estar logado" });
	}
	const seenNotification = req.body.notification;
	User.findOneAndUpdate(
		{ _id: req.user._id, "notifications._id": seenNotification },
		{ $set: { "notifications.$.seen": true } },
		{ new: true },
	)
		.then(() => res.send({ msg: "Updated" }))
		.catch((error) => res.send(error));
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
		emailStatus: "sent",
	});

	return sendNotification(notification, followedID);
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

	if (notification.eventKey === "new_follower") {
		const followedUser = await User.findById(notification.associatedObject);
		await sendEmail(
			targetUser.email,
			"Novo seguidor Manga Shelf",
			"newFollower",
			{
				username: targetUser.username,
				newFollower: followedUser.username,
				imageName: "img1.webp",
			},
			[
				{
					filename: notification.imageUrl,
					path: `${process.env.SITE_DOMAIN}/${
						notification.imageUrl
							? notification.imageUrl
							: "/images/deffault-profile-picture.webp"
					}`,
					contentDisposition: "inline",
					cid: "img1.webp",
					contentType: "img/webp",
				},
			],
		);
	}

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
					contentType: "img/webp",
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

	if (allowEmail) {
		if (notification.eventKey === "new_volume") {
			await sendEmailNotification(notification, targetUserId, dataList);
		} else {
			await sendEmailNotification(notification, targetUserId);
		}
	}
	if (allowSite) {
		if (
			dataList &&
			dataList.length > 0 &&
			notification.eventKey === "new_volume"
		) {
			for (const item of dataList) {
				await sendSiteNotification(
					item.notificationId || notification._id,
					targetUserId,
				);
			}
		} else {
			await sendSiteNotification(notification._id, targetUserId);
		}
	}

	return notification;
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
	if (validPending.length === 0) return;

	const userGroups = validPending.reduce((acc, status) => {
		const userId = status.user._id.toString();
		if (!acc[userId]) acc[userId] = [];
		acc[userId].push(status);
		return acc;
	}, {});

	for (const userId in userGroups) {
		const statuses = userGroups[userId];
		const user = statuses[0].user;

		if (isBatch) {
			const dataList = statuses.map((s) => s.notification.associatedObject);
			await sendNotification(statuses[0].notification, user._id, dataList);
		} else {
			for (const status of statuses) {
				await sendNotification(status.notification, user._id);
			}
		}

		await UserNotificationStatus.updateMany(
			{ _id: { $in: statuses.map((s) => s._id) } },
			{ $set: { emailStatus: "sent", siteStatus: "sent" } },
		);
	}
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
exports.sendNotification = sendNotification