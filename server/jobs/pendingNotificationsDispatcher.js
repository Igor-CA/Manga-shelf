//Job responsible to send pending notifications in a smaller period
const logger = require("../Utils/logger");
const notificationsController = require("../controllers/notifications");
const { success, retryableFailure } = require("./jobResult");

async function dispatchPendingNotifications() {
	logger.info("Running pending notifications Dispatcher...");
	const volumeFailures = await notificationsController.processPendingNotifications(
		"volume_deleted",
	);
	const seriesFailures = await notificationsController.processPendingNotifications(
		"series_deleted",
	);
	logger.info("Pending notification Dispatcher Job finished.");

	const failedCount = (volumeFailures || 0) + (seriesFailures || 0);
	if (failedCount > 0) {
		return retryableFailure("recipient_delivery_failed", { failedCount });
	}
	return success();
}
module.exports = { dispatchPendingNotifications };
