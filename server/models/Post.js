const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostSchema = new Schema(
	{
		author: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		series: {
			type: Schema.Types.ObjectId,
			ref: "Series",
			required: true,
		},
		volume: {
			type: Schema.Types.ObjectId,
			ref: "Volume",
			default: null,
		},
		text: {
			type: String,
			required: true,
			minlength: 1,
			maxlength: 5000,
		},
	},
	{ timestamps: true },
);

PostSchema.index({ series: 1, volume: 1, createdAt: -1 });

module.exports = mongoose.model("Post", PostSchema);
