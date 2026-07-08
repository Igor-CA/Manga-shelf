const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PendingReplyDigestSchema = new Schema(
	{
		recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
		topLevelComment: {
			type: Schema.Types.ObjectId,
			ref: "Post",
			required: true,
		},
		flushAfter: { type: Date, required: true },
		repliers: [
			{
				_id: false,
				user: { type: Schema.Types.ObjectId, ref: "User", required: true },
				username: { type: String, required: true },
			},
		],
	},
	{ timestamps: true },
);

PendingReplyDigestSchema.index(
	{ recipient: 1, topLevelComment: 1 },
	{ unique: true },
);
PendingReplyDigestSchema.index({ flushAfter: 1 });

module.exports = mongoose.model("PendingReplyDigest", PendingReplyDigestSchema);
