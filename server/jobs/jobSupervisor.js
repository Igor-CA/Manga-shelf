const JobRun = require("../models/JobRun");
const logger = require("../Utils/logger");
const { runJob, getRegisteredJob } = require("./jobRunner");

async function runSupervisor() {
	const matured = await JobRun.find({
		status: "failed",
		nextAttemptAt: { $lte: new Date() },
	});

	if (matured.length === 0) return;

	for (const run of matured) {
		const spec = getRegisteredJob(run.name);
		if (!spec) {
			logger.warn(
				`Supervisor: job "${run.name}" is not registered, skipping matured run.`,
			);
			continue;
		}

		await runJob({ ...spec, scheduledFor: run.scheduledFor });
	}
}

module.exports = { runSupervisor };
