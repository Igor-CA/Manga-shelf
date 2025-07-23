const cron = require("node-cron");
const logger = require("./Utils/logger");
const { backupDatabase } = require("./jobs/backupRoutine");
const { syncAndRecalculateData } = require("./jobs/dataSyncRoutine");
const {
	dispatchSiteNotifications,
} = require("./jobs/siteNotificationsDispatcher");
const { dispatchEmails } = require("./jobs/emailDispatcher");
const APP_TIMEZONE = "America/Sao_Paulo";

function startScheduledJobs() {
	logger.info("Scheduling background jobs...");

	cron.schedule(
		"0 5 * * *",
		async () => {
			logger.info("CRON: Triggering dayly database backup...");
			try {
				await backupDatabase();
			} catch (error) {
				logger.error("CRON: Database backup task failed.", { error });
			}
		},
		{ timezone: APP_TIMEZONE }
	);

	cron.schedule(
		"0 3 * * *",
		async () => {
			logger.info("CRON: Triggering daily data maintenance routine...");
			try {
				await syncAndRecalculateData();
			} catch (error) {
				logger.error("CRON: Data maintenance routine failed.", { error });
			}
		},
		{ timezone: APP_TIMEZONE }
	);

	cron.schedule(
		"0 4 * * 1",
		async () => {
			logger.info("CRON: Triggering Volumes site notification routine...");
			try {
				await dispatchSiteNotifications();
			} catch (error) {
				logger.error("CRON: Volumes site notification routine failed.", {
					error,
				});
			}
		},
		{ timezone: APP_TIMEZONE }
	);

	cron.schedule(
		"0 9 * * 1",
		async () => {
			logger.info("CRON: Triggering Volumes email notification routine...");
			try {
				await dispatchEmails();
			} catch (error) {
				logger.error("CRON: Volumes email notification routine failed.", {
					error,
				});
			}
		},
		{ timezone: APP_TIMEZONE }
	);
	logger.info("All background jobs have been scheduled.");
}

module.exports = startScheduledJobs;
