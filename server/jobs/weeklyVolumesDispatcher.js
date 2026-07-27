//Job responsible to send weekly notifications with new volumes batched as a single email to each user
const {
	sendNotification,
	markDeliveryStatus,
} = require("../controllers/notifications");
const UserNotificationStatus = require("../models/UserNotificationStatus");
const logger = require("../Utils/logger");
const { success, retryableFailure } = require("./jobResult");

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

	const volumePending = pendingStatuses.filter(
		(s) => s.notification && s.notification.associatedObject,
	);

	if (volumePending.length === 0) {
		logger.info("No pending volume notifications found.");
		return success();
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

	let failedCount = 0;

	for (const userId in userGroups) {
		const statuses = userGroups[userId];
		const user = statuses[0].user;

		try {
			const volumesWithNotifs = statuses.map((s) => ({
				...s.notification.associatedObject.toObject(),
				notificationId: s.notification._id,
				siteAlreadySent: s.siteStatus === "sent",
			}));

			const result = await sendNotification(
				statuses[0].notification,
				user._id,
				volumesWithNotifs,
			);

			await markDeliveryStatus(statuses, result);

			if (result.site.status === "failed" || result.email.status === "failed") {
				failedCount++;
				logger.error(
					`Weekly volume dispatch incomplete for user ${user.username}: ${result.error?.message}`,
				);
			}
		} catch (err) {
			failedCount++;
			logger.error(
				`Weekly volume dispatch failed for user ${user.username}:`,
				err.message,
			);
		}
	}
	logger.info("Weekly Dispatcher Job finished.");

	if (failedCount > 0) {
		return retryableFailure("recipient_delivery_failed", { failedCount });
	}
	return success();
}
module.exports = { dispatchWeeklyVolumes };
