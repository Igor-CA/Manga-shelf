//Job responsible to send pending notifications in a smaller period
const logger = require("../Utils/logger");
const notificationsController = require("../controllers/notifications");
async function dispatchPendingNotifications() {
	logger.info("Running Weekly New Volume Dispatcher...");
	await notificationsController.processPendingNotifications("volume_deleted");
	await notificationsController.processPendingNotifications("series_deleted");
	logger.info("Weekly Dispatcher Job finished.");
}
module.exports = { dispatchPendingNotifications };
