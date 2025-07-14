//Job responsible to send emails with new volumes batched as a single email to each user
const User = require("../models/User");
const Notifications = require("../models/Notification");
const Volume = require("../models/volume");
const Series = require("../models/Series");
const UserNotificationStatus = require("../models/UserNotificationStatus");
const {
    sendSiteNotification,
} = require("../controllers/notifications");

async function dispatchSiteNotifications() {
	console.log("Running Site Dispatcher Job...");

	const pendingNotifications = await UserNotificationStatus.find({
		siteStatus: "pending",
	})
		.populate("user", "username")
		.populate({
			path: "notification",
			populate: {
				path: "associatedObject",
				model: "Volume",
				populate: {
					path: "serie",
					model: "Series",
					select: "title",
				},
			},
		});
	if (pendingNotifications.length === 0) {
		console.log("No pending notifications to send.");
		return;
	}

	const userGroupedStatuses = pendingNotifications.reduce(
		(acc, notification) => {
			const userId = notification.user._id.toString();
			if (!acc[userId]) {
				acc[userId] = [];
			}
			acc[userId].push(notification);
			return acc;
		},
		{}
	);
	for (const userId in userGroupedStatuses) {
		const statusGroup = userGroupedStatuses[userId];
		const user = statusGroup[0].user;
		const notificationsList = statusGroup.map((status) => status.notification);

		if (notificationsList.length === 0) continue;

		console.log(
			`Sending ${notificationsList.length} new volumes notifications to ${user.username} profile.`
		);
		for (const notification of notificationsList) {
			try {
				await sendSiteNotification(notification._id, user._id);
				const statusIdsToUpdate = statusGroup.map((status) => status._id);
				await UserNotificationStatus.updateMany(
					{ _id: { $in: statusIdsToUpdate } },
					{ $set: { siteStatus: "sent" } }
				);
			} catch (error) {
				console.error(`Failed to add notification to ${user.username}:`, error);
			}
		}
	}
	console.log("Notification Dispatcher Job finished.");
}
module.exports = { dispatchSiteNotifications };
