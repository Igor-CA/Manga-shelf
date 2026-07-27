//Job responsible for flushing matured reply-digest windows into grouped notifications
const logger = require("../Utils/logger");
const notificationsController = require("../controllers/notifications");
const { success } = require("./jobResult");

async function dispatchReplyDigests() {
	logger.info("Running reply digest dispatcher...");
	await notificationsController.dispatchReplyDigests();
	logger.info("Reply digest dispatcher finished.");
	return success();
}
module.exports = { dispatchReplyDigests };
