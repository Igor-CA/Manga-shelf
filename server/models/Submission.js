const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SubmissionSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},

		targetModel: {
			type: String,
			required: true,
			enum: ["Series", "Volume"],
		},

		targetId: {
			type: Schema.Types.ObjectId,
			refPath: "targetModel",
			index: true,
		},

		payload: {
			type: Schema.Types.Mixed,
			required: true,
		},

		notes: {
			type: String,
			required: true,
		},

		status: {
			type: String,
			enum: ["Pendente", "Aprovado", "Rejeitado"],
			default: "Pendente",
			index: true,
		},

		adminComment: {
			type: String,
		},

		reviewedBy: {
			type: Schema.Types.ObjectId,
			ref: "User",
		},
		evidenceImage: { type: String },
	},
	{ timestamps: true },
);

module.exports = mongoose.model("Submission", SubmissionSchema);
