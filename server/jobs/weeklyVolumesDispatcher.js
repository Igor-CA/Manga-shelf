//Job responsible to send weekly notifications with new volumes batched as a single email to each user
const UserNotificationStatus = require("../models/UserNotificationStatus");
const logger = require("../Utils/logger");
const {
	sendNotification,
	sendSiteNotification,
} = require("../controllers/notifications");

async function dispatchWeeklyVolumes() {
	logger.info("Running Weekly New Volume Dispatcher...");

	const pendingStatuses = await UserNotificationStatus.find({
		$or: [{ siteStatus: "pending" }, { emailStatus: "pending" }],
	})
		.populate("user")
		.populate({
			path: "notification",
			populate: {
				path: "associatedObject",
				model: "Volume",
				populate: { path: "serie", model: "Series", select: "title" },
			},
		});

	if (pendingStatuses.length === 0) {
		logger.info("No pending volume notifications found.");
		return;
	}

	const userGroups = pendingStatuses.reduce((acc, status) => {
		const userId = status.user._id.toString();
		if (!acc[userId]) acc[userId] = [];
		acc[userId].push(status);
		return acc;
	}, {});

	for (const userId in userGroups) {
		const statuses = userGroups[userId];
		const user = statuses[0].user;
		const volumeNotifs = statuses.map((s) => s.notification);
		const volumesList = volumeNotifs
			.map((n) => n.associatedObject)
			.filter((v) => v);

		try {
			const sitePending = statuses.filter((s) => s.siteStatus === "pending");
			for (const status of sitePending) {
				await sendSiteNotification(status.notification._id, user._id);
				await UserNotificationStatus.findByIdAndUpdate(status._id, {
					siteStatus: "sent",
				});
			}

			const emailPending = statuses.filter((s) => s.emailStatus === "pending");
			if (emailPending.length > 0) {
				await sendNotification(volumeNotifs[0], user._id, volumesList);

				const emailIds = emailPending.map((s) => s._id);
				await UserNotificationStatus.updateMany(
					{ _id: { $in: emailIds } },
					{ $set: { emailStatus: "sent" } },
				);
			}
		} catch (error) {
			logger.error(`Error dispatching for user ${user.username}:`, error);
		}
	}
	logger.info("Weekly Dispatcher Job finished.");
}
module.exports = { dispatchWeeklyVolumes };
