const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RatingSchema = new Schema(
	{
		user: { type: Schema.Types.ObjectId, ref: "User", required: true },
		series: { type: Schema.Types.ObjectId, ref: "Series", required: true },
		volume: { type: Schema.Types.ObjectId, ref: "Volume", default: null },
		score: { type: Number, min: 1, max: 10, required: true },
	},
	{ timestamps: true },
);

RatingSchema.index({ user: 1, series: 1, volume: 1 }, { unique: true });
RatingSchema.index({ series: 1, volume: 1 });
RatingSchema.index({ volume: 1 });

module.exports = mongoose.model("Rating", RatingSchema);
