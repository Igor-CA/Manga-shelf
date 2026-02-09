//Job responsible to send weekly notifications with new volumes batched as a single email to each user
const { sendNotification } = require("../controllers/notifications");
const UserNotificationStatus = require("../models/UserNotificationStatus");
const logger = require("../Utils/logger");

async function dispatchWeeklyVolumes() {
	logger.info("Running Weekly New Volume Dispatcher...");

	const pendingStatuses = await UserNotificationStatus.find({
		$or: [{ siteStatus: "pending" }, { emailStatus: "pending" }],
	})
		.populate({
			path: "user",
			select: "username _id email settings"
		})
		.populate({
			path: "notification",
			match: { eventKey: "new_volume" },
			populate: {
				path: "associatedObject",
				model: "Volume",
				populate: { path: "serie", model: "Series", select: "title" },
			},
		});

	const volumePending = pendingStatuses.filter((s) => s.notification !== null);

	if (volumePending.length === 0) {
		logger.info("No pending volume notifications found.");
		return;
	}
	
	const userGroups = volumePending.reduce((acc, status) => {
		
		if (!status.user) {
            logger.warn(`Skipping status ${status._id}: User not found (orphaned record).`);
            return acc;
        }

		const userId = status.user._id.toString();
		if (!acc[userId]) acc[userId] = [];
		acc[userId].push(status);
		return acc;
	}, {});

	for (const userId in userGroups) {
		const statuses = userGroups[userId];
		const user = statuses[0].user;
		const volumesWithNotifs = statuses.map((s) => ({
			...s.notification.associatedObject.toObject(),
			notificationId: s.notification._id,
		}));

		await sendNotification(
			statuses[0].notification,
			user._id,
			volumesWithNotifs,
		);

		await UserNotificationStatus.updateMany(
			{ _id: { $in: statuses.map((s) => s._id) } },
			{ $set: { siteStatus: "sent", emailStatus: "sent" } },
		);
	}
	logger.info("Weekly Dispatcher Job finished.");
}
module.exports = { dispatchWeeklyVolumes };
