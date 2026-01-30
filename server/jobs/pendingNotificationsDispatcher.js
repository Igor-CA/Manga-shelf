//Job responsible to send pending notifications in a smaller period
const logger = require("../Utils/logger");
const notificationsController = require("../controllers/notifications");
async function dispatchPendingNotifications() {
	logger.info("Running pending notifications Dispatcher...");
	await notificationsController.processPendingNotifications("volume_deleted");
	await notificationsController.processPendingNotifications("series_deleted");
	logger.info("Pending notification Dispatcher Job finished.");
}
module.exports = { dispatchPendingNotifications };
