const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const JobRunSchema = new Schema(
	{
		name: { type: String, required: true },
		scheduledFor: { type: Date, required: true },
		status: {
			type: String,
			enum: ["pending", "running", "succeeded", "failed", "abandoned"],
			default: "pending",
		},
		attempts: { type: Number, default: 0 },
		nextAttemptAt: { type: Date, default: null },
		lastError: {
			message: { type: String, default: null },
			code: { type: String, default: null },
			reason: { type: String, default: null },
		},
		leaseUntil: { type: Date, default: null },
	},
	{ timestamps: true },
);

JobRunSchema.index({ name: 1, scheduledFor: 1 }, { unique: true });
JobRunSchema.index({ status: 1, nextAttemptAt: 1 });

JobRunSchema.index(
	{ updatedAt: 1 },
	{
		expireAfterSeconds: 30 * 24 * 60 * 60,
		partialFilterExpression: { status: { $in: ["succeeded", "abandoned"] } },
	},
);

module.exports = mongoose.model("JobRun", JobRunSchema);
