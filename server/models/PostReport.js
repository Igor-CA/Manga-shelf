const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostReportSchema = new Schema(
	{
		reporter: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		post: {
			type: Schema.Types.ObjectId,
			ref: "Post",
			required: true,
		},
		reason: {
			type: String,
			required: true,
			enum: ["hate", "adult", "spoiler"],
		},
		reportedText: {
			type: String,
		},
		status: {
			type: String,
			enum: ["Pendente", "Resolvido", "Descartado"],
			default: "Pendente",
		},
		resolution: {
			type: String,
		},
		reviewedBy: {
			type: Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
	},
	{ timestamps: true },
);

PostReportSchema.index({ reporter: 1, post: 1, reason: 1 }, { unique: true });
PostReportSchema.index({ post: 1, reason: 1, status: 1 });
PostReportSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model("PostReport", PostReportSchema);
