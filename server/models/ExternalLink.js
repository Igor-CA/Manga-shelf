const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ExternalLinkSchema = new Schema(
	{
		targetModel: { type: String, required: true, enum: ["Series", "Volume"] },
		targetId: {
			type: Schema.Types.ObjectId,
			required: true,
			refPath: "targetModel",
		},
		provider: { type: String, required: true, lowercase: true, trim: true },
		externalId: { type: String, required: true, trim: true },
	},
	{ timestamps: true },
);

ExternalLinkSchema.index(
	{ targetModel: 1, targetId: 1, provider: 1 },
	{ unique: true },
);

module.exports = mongoose.model("ExternalLink", ExternalLinkSchema);
