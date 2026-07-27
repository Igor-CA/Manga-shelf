const JobRun = require("../models/JobRun");
const logger = require("../Utils/logger");
const { retryableFailure } = require("./jobResult");

const registry = new Map();

function truncateToMinute(date) {
	const truncated = new Date(date);
	truncated.setSeconds(0, 0);
	return truncated;
}

function getRegisteredJob(name) {
	return registry.get(name);
}

function describeFailure(result, thrownErr) {
	if (thrownErr) {
		return {
			message: thrownErr.message,
			code: thrownErr.code || null,
			reason: "unclassified_error",
		};
	}

	const details = result.details;
	const message =
		(details && typeof details.message === "string" && details.message) ||
		(details ? `${result.reason}: ${JSON.stringify(details)}` : result.reason) ||
		"Job failed";

	return {
		message,
		code: (details && details.code) || null,
		reason: result.reason || null,
	};
}

async function runJob(spec) {
	const { name, fn, backoffMinutes = [], leaseMinutes, scheduledFor } = spec;
	const maxAttempts = spec.maxAttempts ?? backoffMinutes.length + 1;

	registry.set(name, spec);

	const now = new Date();
	const occurrence = scheduledFor || truncateToMinute(now);
	const leaseUntil = new Date(now.getTime() + leaseMinutes * 60 * 1000);

	const runningElsewhere = await JobRun.findOne({
		name,
		status: "running",
		leaseUntil: { $gt: now },
		scheduledFor: { $ne: occurrence },
	});
	if (runningElsewhere) {
		logger.warn(`Job "${name}" skipped: another run is already in progress.`);
		return;
	}

	const run = await JobRun.findOneAndUpdate(
		{ name, scheduledFor: occurrence },
		{
			$setOnInsert: {
				name,
				scheduledFor: occurrence,
				status: "pending",
				attempts: 0,
			},
		},
		{ upsert: true, new: true },
	);

	const claimed = await JobRun.findOneAndUpdate(
		{
			_id: run._id,
			$or: [{ status: { $ne: "running" } }, { leaseUntil: { $lt: now } }],
		},
		{ $set: { status: "running", leaseUntil } },
		{ new: true },
	);

	if (!claimed) {
		logger.warn(
			`Job "${name}" skipped: already running (occurrence ${occurrence.toISOString()}).`,
		);
		return;
	}

	let result;
	let thrownErr = null;
	try {
		result = (await fn()) || { ok: true };
	} catch (err) {
		thrownErr = err;
		result = retryableFailure("unclassified_error", {
			message: err.message,
			code: err.code,
		});
	}

	if (result.ok) {
		await JobRun.updateOne(
			{ _id: claimed._id },
			{ $set: { status: "succeeded", nextAttemptAt: null, leaseUntil: null } },
		);
		logger.info(`Job "${name}" succeeded.`);
		return;
	}

	const attempts = claimed.attempts + 1;
	const lastError = describeFailure(result, thrownErr);

	if (!result.retryable || attempts >= maxAttempts) {
		await JobRun.updateOne(
			{ _id: claimed._id },
			{
				$set: {
					status: "abandoned",
					attempts,
					nextAttemptAt: null,
					leaseUntil: null,
					lastError,
				},
			},
		);
		logger.error(
			`Job "${name}" abandoned after ${attempts} attempt(s): ${lastError.message}`,
		);
		return;
	}

	const backoffEntry =
		backoffMinutes[attempts - 1] ?? backoffMinutes[backoffMinutes.length - 1] ?? 60;
	const nextAttemptAt = new Date(now.getTime() + backoffEntry * 60 * 1000);

	await JobRun.updateOne(
		{ _id: claimed._id },
		{
			$set: {
				status: "failed",
				attempts,
				nextAttemptAt,
				leaseUntil: null,
				lastError,
			},
		},
	);
	logger.warn(
		`Job "${name}" failed (attempt ${attempts}/${maxAttempts}), next attempt at ${nextAttemptAt.toISOString()}: ${lastError.message}`,
	);
}

module.exports = { runJob, getRegisteredJob, truncateToMinute };
