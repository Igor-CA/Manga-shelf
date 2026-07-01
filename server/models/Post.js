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
		parent: {
			type: Schema.Types.ObjectId,
			ref: "Post",
			default: null,
		},
		replyCount: {
			type: Number,
			default: 0,
		},
		likeCount: {
			type: Number,
			default: 0,
		},
		isReview: {
			type: Boolean,
			default: false,
		},
		image: {
			type: String,
			default: null,
		},
		isSpoiler: {
			type: Boolean,
			default: false,
		},
		isAdultContent: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true },
);

PostSchema.index({ series: 1, volume: 1, createdAt: -1 });
PostSchema.index({ parent: 1, createdAt: 1 });
PostSchema.index(
	{ author: 1, series: 1, volume: 1 },
	{ unique: true, partialFilterExpression: { isReview: true } },
);

module.exports = mongoose.model("Post", PostSchema);
