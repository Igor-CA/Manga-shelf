const Notification = require("../models/Notification");
const asyncHandler = require("express-async-handler");
const Volume = require("../models/volume");
const User = require("../models/User");

const { getVolumeCoverURL } = require("../Utils/getCoverFunctions");
const { sendEmail } = require("../Utils/sendEmail");


exports.setNotificationAsSeen = asyncHandler(async (req, res, next) => {
	if (!req.isAuthenticated()) {
		return res.status(401).json({ msg: "Usuário deve estar logado" });
	}
	const seenNotification = req.body.notification;
	User.findOneAndUpdate(
		{ _id: req.user._id, "notifications._id": seenNotification },
		{ $set: { "notifications.$.seen": true } },
		{ new: true }
	)
		.then(() => res.send({ msg: "Updated" }))
		.catch((error) => res.send(error));
});

exports.getUserNotifications = asyncHandler(async (req, res, next) => {

	if (!req.isAuthenticated()) {
		return res.status(401).json({ msg: "Usuário deve estar logado" });
	}
	const user = await User.findById(req.user._id, "notifications").populate({
		path: "notifications.notification",
	});

	if (!user) return res.status(400).json({ msg: "User not found" });

	const { type, page } = req.query;
	if (!type) {
		const notifications = await getAllNotifications(req.user._id, {
			followersPage: 1,
			followersLimit: 10,
			volumesPage: 1,
			volumesLimit: 10,
			updatesPage: 1,
			updatesLimit: 10,
		});
		res.send(notifications);
	} else {
		const notifications = await getTypeNotifications(
			req.user._id,
			{
				page: page || 1,
				limit: 10,
			},
			type
		);
		res.send(notifications);
	}
});

async function getAllNotifications(userId, paginationOptions) {
	const {
		followersPage = 1,
		followersLimit = 10,
		volumesPage = 1,
		volumesLimit = 10,
		updatesPage = 1,
		updatesLimit = 10,
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
		{
			$replaceRoot: { newRoot: "$notificationDetails" },
		},
		{
			$facet: {
				followers: [
					{ $match: { type: "followers" } },
					{ $sort: { date: -1 } },
					{ $skip: (followersPage - 1) * followersLimit },
					{ $limit: followersLimit },
				],
				volumes: [
					{ $match: { type: "volumes" } },
					{ $sort: { date: -1 } },
					{ $skip: (volumesPage - 1) * volumesLimit },
					{ $limit: volumesLimit },
				],
				updates: [
					{ $match: { type: "site" } },
					{ $sort: { date: -1 } },
					{ $skip: (updatesPage - 1) * updatesLimit },
					{ $limit: updatesLimit },
				],
			},
		},
	]);

	return results[0];
}
async function getTypeNotifications(userId, paginationOptions, type) {
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
		{
			$replaceRoot: { newRoot: "$notificationDetails" },
		},
		{ $match: { type } },
		{ $sort: { date: -1 } },
		{ $skip: (page - 1) * limit },
		{ $limit: limit },
	]);

	return results;
}

exports.sendSiteNewsNotification = async (updatesList) => {
	const notification = await createSiteNewsNotification(updatesList);
	const users = await User.find({})
	
	
	for(const user of users){
		await sendNotification(notification, user._id);
	}
		
	return notification
};

async function createSiteNewsNotification(updatesList) {

	const newNotification = new Notification({
		type: "site",
		text: "O Manga Shelf foi atualizado. Veja as novidades",
		imageUrl: `/images/android-chrome-192x192.png`,
		details: updatesList
	});
	await newNotification.save();
	return newNotification;
}

async function createNewVolumeNotification(newVolume) {
	const existingNotification = await Notification.findOne({
		type: "volumes",
		associatedObject: newVolume._id,
		objectType: "Volume",
	});
	if (existingNotification) return existingNotification;
	if (!newVolume) return;

	const newNotification = new Notification({
		type: "volumes",
		text: `Um novo volume de ${newVolume.serie.title} foi adicionado ao site`,
		imageUrl: getVolumeCoverURL(newVolume.serie, newVolume.number),
		associatedObject: newVolume._id,
		objectType: "Volume",
	});
	await newNotification.save();
	return newNotification;
}
exports.sendNewVolumeNotification = async (volumesList, targetUserId) => {
	const notificationsList = []
	for(const volume of volumesList){
		const notification = await createNewVolumeNotification(volume);
		notificationsList.push(notification)
	}
	const firstNotification = notificationsList[0]

	const { allowNotifications, allowType, allowEmail, allowSite } =
		await checkNotificationSettings(targetUserId, firstNotification.type);
	
	if (!allowNotifications || !allowType) return;
	if (allowEmail) {
		await sendEmailNotification(firstNotification, targetUserId, volumesList);
	}
	if (allowSite) {
		for(const notification of notificationsList){
			await sendSiteNotification(notification, targetUserId);
		}
	}
};
async function createFollowingNotification(userId) {
	const [existingNotification, user] = await Promise.all([
		Notification.findOne({
			type: "followers",
			associatedObject: userId,
			objectType: "User",
		}),
		User.findById(userId),
	]);
	if (existingNotification) return existingNotification;
	if (!user) return;

	const newNotification = new Notification({
		type: "followers",
		text: `${user.username} Começou a te seguir`,
		imageUrl: user.profileImageUrl,
		associatedObject: userId,
		objectType: "User",
	});
	await newNotification.save();
	return newNotification;
}
exports.sendNewFollowerNotification = async (followerID, followedID) => {
	const notification = await createFollowingNotification(followerID);
	return sendNotification(notification, followedID);
};
async function checkNotificationSettings(userId, type) {
	const user = await User.findById(userId);
	const allowNotifications = user.settings.notifications.allow;

	const allowType = user.settings.notifications[type];
	const allowEmail = user.settings.notifications.email;
	const allowSite = user.settings.notifications.site;
	return { allowNotifications, allowType, allowEmail, allowSite };
}
async function sendEmailNotification(notification, targetUserId, volumesList) {
	const targetUser = await User.findById(targetUserId);

	if (notification.type === "followers") {
		const followedUser = await User.findById(notification.associatedObject);
		sendEmail(
			targetUser.email,
			"Novos volumes Manga Shelf",
			"newFollower",
			{
				username: targetUser.username,
				newFollower: followedUser.username,
				imageName: "img1.webp",
			},
			[
				{
					filename: notification.imageUrl,
					path: `${process.env.HOST_ORIGIN}/${
						notification.imageUrl
							? notification.imageUrl
							: "/images/deffault-profile-picture.webp"
					}`,
					contentDisposition: "inline",
					cid: "img1.webp",
					contentType: "img/webp",
				},
			]
		);
	}
	if (notification.type === "volumes") {
		const attachments = volumesList.map((volume, id) => {
			return {
				filename: getVolumeCoverURL(volume.serie, volume.number),
				path: `${
					process.env.HOST_ORIGIN
				}/images/medium/${getVolumeCoverURL(
					volume.serie,
					volume.number
				)}`,
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
				volumes: volumesList,
			},
			attachments
		);
	}
	if (notification.type === "site") {
		await sendEmail(
			targetUser.email,
			"Nova atualização no Manga Shelf",
			"siteUpdatesEmail",
			{
				username: targetUser.username,
				notification
			}
		);
		
	}

	return;
}
async function sendSiteNotification(notificationId, targetUserId) {
	await User.findByIdAndUpdate(
		targetUserId,
		{ $push: { notifications: { notification: notificationId } } },
		{ new: true }
	);
	return;
}
async function sendNotification(notification, targetUserId, dataList) {
	const { allowNotifications, allowType, allowEmail, allowSite } =
		await checkNotificationSettings(targetUserId, notification.type);
	if (!allowNotifications || !allowType) return;
	if (allowEmail) {
		if (notification.type === "volumes") {
			await sendEmailNotification(notification, targetUserId, dataList);
		} else {
			await sendEmailNotification(notification, targetUserId);
		}
	}
	if (allowSite) {
		await sendSiteNotification(notification, targetUserId);
	}
	return notification;
}
