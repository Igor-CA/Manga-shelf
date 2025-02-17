const Notification = require("../models/Notification");
const asyncHandler = require("express-async-handler");
const Volume = require("../models/volume");
const User = require("../models/User");

const { getVolumeCoverURL } = require("../Utils/getCoverFunctions");

exports.testNotification = asyncHandler(async (req, res, next) => {

	// const notification = await sendNewFollowerNotification(
	// 	req.body.follower,
	// 	req.body.followed
	// );
	
	const notification = await sendNewVolumeNotification(
		req.body.volume,
		req.body.targetUser
	);
	
	//const notification = await createNewVolumeNotification(req.body.volume);
	res.status(201).json({ notification });
});

exports.getUserNotifications = asyncHandler(async (req, res, next) => {
	if (
		req.headers.authorization !== process.env.API_KEY &&
		process.env.NODE_ENV === "production"
	) {
		res.status(401).json({ msg: "Not authorized" });
		return;
	}
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
			},
		},
		{
			$replaceRoot: { newRoot: "$notificationDetails" },
		},
		{
			$facet: {
				followers: [
					{ $match: { type: "followers" } },
					{ $sort: { _id: 1 } },
					{ $skip: (followersPage - 1) * followersLimit },
					{ $limit: followersLimit },
				],
				volumes: [
					{ $match: { type: "volume" } },
					{ $sort: { _id: 1 } },
					{ $skip: (volumesPage - 1) * volumesLimit },
					{ $limit: volumesLimit },
				],
				updates: [
					{ $match: { type: "site" } },
					{ $sort: { _id: 1 } },
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
			},
		},
		{
			$replaceRoot: { newRoot: "$notificationDetails" },
		},
		{ $match: { type } },
		{ $sort: { _id: 1 } },
		{ $skip: (page - 1) * limit },
		{ $limit: limit },
	]);

	return results;
}

async function createNewVolumeNotification(volumeId) {
	const [existingNotification, volume] = await Promise.all([
		Notification.findOne({
			type: "volume",
			associatedObject: volumeId,
			objectType: "Volume",
		}),
		Volume.findById(volumeId).populate({ path: "serie" }),
	]);
	if (existingNotification) return existingNotification;
	if (!volume) return;

	const newNotification = new Notification({
		type: "volume",
		text: `Um novo volume de ${volume.serie.title} foi adicionado ao site`,
		imageUrl: getVolumeCoverURL(volume.serie, volume.number),
		associatedObject: volumeId,
		objectType: "Volume",
	});
	await newNotification.save();
	return newNotification;
}
exports.sendNewVolumeNotification = async (volumeId, targetUserId) => {
	const notification = await createNewVolumeNotification(volumeId);
	return sendNotification(notification, targetUserId, "volumes")
}
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
exports.sendNewFollowerNotification = async(followerID, followedID) =>  {
	const notification = await createFollowingNotification(followerID);
	return sendNotification(notification, followedID, "followers")
}
async function checkNotificationSettings(userId, type) {
	const user = await User.findById(userId);
	const allowNotifications = user.settings.notifications.allow;

	const allowType = user.settings.notifications[type];
	const allowEmail = user.settings.notifications.email;
	const allowSite = user.settings.notifications.site;
	return { allowNotifications, allowType, allowEmail, allowSite };
}
function sendEmailNotification(userId) {
	return;
}
async function sendSiteNotification(notificationId, targetUserId) {
	const updatedUser = await User.findByIdAndUpdate(
		targetUserId,
		{ $push: { notifications: { notification: notificationId } } },
		{ new: true }
	);
	return;
}
async function sendNotification(notification, targetUserId, type) {
	const { allowNotifications, allowType, allowEmail, allowSite } =
		await checkNotificationSettings(targetUserId, type);
	if (!allowNotifications || !allowType) return;
	if (allowEmail) {
		sendEmailNotification(targetUserId);
	}
	if (allowSite) {
		sendSiteNotification(notification, targetUserId);
	}
	return notification;
}
