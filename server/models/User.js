const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OwnedVolumeSchema = new Schema(
	{
		volume: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Volume",
			required: true,
		},
		amount: { type: Number, default: 1 },
		acquiredAt: { type: Date, default: Date.now },
		isRead: { type: Boolean, default: false },
		readAt: { type: Date },
		readCount: { type: Number },
		readAt: { type: Date },
		purchasePrice: { type: Number },
		notes: { type: String },
	},
	{ _id: false },
);

const UserSchema = new Schema({
	isAdmin: { type: Boolean, default: false },
	username: { type: String },
	email: { type: String, required: true },
	password: { type: String },
	userList: [
		{
			Series: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Series",
				required: true,
			},
			completionPercentage: { type: Number, default: 0 },
			status: { type: String, default: "Collecting" },
		},
	],
	wishList: {
		type: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Series",
			},
		],
		default: [],
	},
	ownedVolumes: {
		type: [OwnedVolumeSchema],
		default: [],
	},
	following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
	followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
	tokenTimestamp: { type: Date },
	token: { type: String },
	TOSAcceptedAt: { type: Date },
	TOSAccepted: { type: Boolean, default: 1 }, // To fit users created before adding of TOSAcceptedAt
	profileImageUrl: { type: String },
	profileBannerUrl: { type: String },
	allowAdult: { type: Boolean, default: 0 },
	allowedAdultAt: { type: Date },
	settings: {
		notifications: {
			allow: { type: Boolean, default: true },
			site: { type: Boolean, default: true },
			email: { type: Boolean, default: true },
			groups: {
				media: { type: Boolean, default: true },
				social: { type: Boolean, default: true },
				system: { type: Boolean, default: true },
			},
		},
	},
	notifications: [
		{
			notification: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Notifications",
			},
			seen: { type: Boolean, default: 0 },
			date: { type: Date, default: Date.now },
		},
	],
});
UserSchema.index({ "ownedVolumes.volume": 1 });

module.exports = mongoose.model("User", UserSchema);
