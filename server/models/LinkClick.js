const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LinkClickSchema = new Schema(
	{
		provider: { type: String, required: true },
		targetModel: { type: String, required: true, enum: ["Series", "Volume"] },
		targetId: { type: Schema.Types.ObjectId, required: true },
		count: { type: Number, default: 0 },
		lastClickedAt: { type: Date, default: Date.now },
	},
	{ timestamps: true },
);

LinkClickSchema.index(
	{ provider: 1, targetModel: 1, targetId: 1 },
	{ unique: true },
);

module.exports = mongoose.model("LinkClick", LinkClickSchema);
