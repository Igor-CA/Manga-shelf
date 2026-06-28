const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LikeSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		post: {
			type: Schema.Types.ObjectId,
			ref: "Post",
			required: true,
		},
	},
	{ timestamps: true },
);

LikeSchema.index({ user: 1, post: 1 }, { unique: true });
LikeSchema.index({ post: 1 });

module.exports = mongoose.model("Like", LikeSchema);
