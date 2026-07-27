const cron = require("node-cron");
const logger = require("./Utils/logger");
const { backupDatabase } = require("./jobs/backupRoutine");
const { syncAndRecalculateData } = require("./jobs/dataSyncRoutine");
const { dispatchWeeklyVolumes } = require("./jobs/weeklyVolumesDispatcher");
const {
	dispatchPendingNotifications,
} = require("./jobs/pendingNotificationsDispatcher");
const {
	dispatchReplyDigests,
} = require("./jobs/replyDigestDispatcher");
const { generateSitemapFile } = require("./jobs/sitemapRoutine");
const { runJob } = require("./jobs/jobRunner");
const { runSupervisor } = require("./jobs/jobSupervisor");
const APP_TIMEZONE = "America/Sao_Paulo";

function startScheduledJobs() {
	logger.info("Scheduling background jobs...");

	cron.schedule(
		"0 5 * * *",
		async () => {
			logger.info("CRON: Triggering dayly database backup...");
			await runJob({
				name: "backupDatabase",
				fn: backupDatabase,
				backoffMinutes: [60, 120],
				leaseMinutes: 120,
			});
		},
		{ timezone: APP_TIMEZONE },
	);

	cron.schedule(
		"0 3 * * *",
		async () => {
			logger.info("CRON: Triggering daily data maintenance routine...");
			await runJob({
				name: "syncAndRecalculateData",
				fn: syncAndRecalculateData,
				backoffMinutes: [60, 120],
				leaseMinutes: 180,
			});
		},
		{ timezone: APP_TIMEZONE },
	);

	cron.schedule(
		"0 9 * * 1",
		async () => {
			logger.info("CRON: Triggering Weekly Volumes notification routine...");
			await runJob({
				name: "weeklyVolumes",
				fn: dispatchWeeklyVolumes,
				backoffMinutes: [60, 120, 240],
				leaseMinutes: 30,
			});
		},
		{ timezone: APP_TIMEZONE },
	);

	cron.schedule(
		"*/30 * * * *",
		async () => {
			logger.info("CRON: Triggering pending notifications dispatcher...");
			await runJob({
				name: "pendingNotifications",
				fn: dispatchPendingNotifications,
				backoffMinutes: [15, 30],
				leaseMinutes: 15,
			});
		},
		{ timezone: APP_TIMEZONE },
	);

	cron.schedule(
		"*/2 * * * *",
		async () => {
			logger.info("CRON: Triggering reply digest dispatcher...");
			await runJob({
				name: "replyDigests",
				fn: dispatchReplyDigests,
				backoffMinutes: [5, 10],
				leaseMinutes: 5,
			});
		},
		{ timezone: APP_TIMEZONE },
	);

	cron.schedule(
		"0 4 * * 1",
		async () => {
			logger.info("CRON: Triggering weekly sitemap generation...");
			await runJob({
				name: "generateSitemap",
				fn: generateSitemapFile,
				backoffMinutes: [30, 60],
				leaseMinutes: 15,
			});
		},
		{ timezone: APP_TIMEZONE },
	);

	cron.schedule(
		"*/10 * * * *",
		async () => {
			await runSupervisor();
		},
		{ timezone: APP_TIMEZONE },
	);

	logger.info("All background jobs have been scheduled.");
}

module.exports = startScheduledJobs;
