const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CollectionPhotoSchema = new Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		imageUrl: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			default: "",
		},
		date: {
			type: Date,
			required: true,
		},
		order: {
			type: Number,
			default: 0,
		},
		isVisible: {
			type: Boolean,
			default: true,
		},
		isAdultContent: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true },
);

CollectionPhotoSchema.index({ user: 1, date: -1, order: 1 });

module.exports = mongoose.model("CollectionPhoto", CollectionPhotoSchema);
