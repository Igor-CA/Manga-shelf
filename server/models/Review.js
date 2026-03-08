const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReviewSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		series: {
			type: Schema.Types.ObjectId,
			ref: "Series",
			required: true,
		},
		score: {
			type: Number,
			required: true,
			min: 1,
			max: 10,
		},
		text: {
			type: String,
			maxlength: 5000,
		},
	},
	{ timestamps: true },
);

ReviewSchema.index({ user: 1, series: 1 }, { unique: true });
ReviewSchema.index({ series: 1, createdAt: -1 });

module.exports = mongoose.model("Review", ReviewSchema);
