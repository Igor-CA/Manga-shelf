//Job responsible to send emails with new volumes batched as a single email to each user
const  User  = require("../models/User");
const  Notifications  = require("../models/Notification");
const  Volume  = require("../models/volume");
const  Series  = require("../models/Series");
const  UserNotificationStatus  = require("../models/UserNotificationStatus");
const { sendEmailNotification } = require("../controllers/notifications");

async function dispatchEmails(){
	console.log("[INFO] Running Email Dispatcher Job...");

	const pendingNotifications = await UserNotificationStatus.find({
		emailStatus: "pending",
	})
		.populate("user", "email username")
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
		console.log("[ERROR] No pending emails to send.");
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
        const notification = statusGroup[0].notification

		const volumesList = statusGroup
			.map((status) => status.notification.associatedObject)
			.filter((volume) => volume); // Filter out any null/undefined volumes

		if (volumesList.length === 0) continue;

		console.log(
			`[INFO] Sending ONE summary email to ${user.username} for ${volumesList.length} new volumes.`
		);

		try {
		    await sendEmailNotification(notification, user._id, volumesList);
			const statusIdsToUpdate = statusGroup.map((status) => status._id);
			await UserNotificationStatus.updateMany(
				{ _id: { $in: statusIdsToUpdate } },
				{ $set: { emailStatus: "sent" } }
			);
		} catch (error) {
			console.error(`Failed to send email to ${user.username}:`, error);
		}
	}

	console.log("[INFO] Email Dispatcher Job finished.");
}
module.exports = { dispatchEmails }; 

