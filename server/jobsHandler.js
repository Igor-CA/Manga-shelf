const cron = require("node-cron");
const logger = require("./Utils/logger");
const { backupDatabase } = require("./jobs/backupRoutine");
const { syncAndRecalculateData } = require("./jobs/dataSyncRoutine");
const { dispatchWeeklyVolumes } = require("./jobs/weeklyVolumesDispatcher");
const { dispatchPendingNotifications } = require("./jobs/pendingNotificationsDispatcher");
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
		"0 9 * * 1",
		async () => {
			logger.info("CRON: Triggering Weekly Volumes notification routine...");
			try {
				await dispatchWeeklyVolumes();
			} catch (error) {
				logger.error("CRON: Weekly Volumes notification routine failed.", {
					error,
				});
			}
		},
		{ timezone: APP_TIMEZONE }
	);

		cron.schedule(
		"*/30 * * * *",
		async () => {
			logger.info("CRON: Triggering pending notifications dispatcher...");
			try {
				await dispatchPendingNotifications();
			} catch (error) {
				logger.error("CRON: pending notification routine failed.", {
					error,
				});
			}
		},
		{ timezone: APP_TIMEZONE }
	);
	logger.info("All background jobs have been scheduled.");
}

module.exports = startScheduledJobs;
