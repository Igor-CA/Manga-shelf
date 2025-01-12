const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
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
		},
	],
	ownedVolumes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Volume" }],
	following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
	followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
	tokenTimestamp: { type: Date },
	token: { type: String },
	TOSAcceptedAt: { type: Date },
	TOSAccepted: { type: Boolean }, // To fit users created before adding of TOSAcceptedAt
	profileImageUrl: { type: String },
	profileBannerUrl: { type: String },
	allowAdult: { type: Boolean, default: 0 },
	allowedAdultAt: { type: Date }, 
	settings: {
		notifications: {
			allow: { type: Boolean, default: 1 },
			volumes: { type: Boolean, default: 1 },
			followers: { type: Boolean, default: 1 },
			updates: { type: Boolean, default: 1 },
			site: { type: Boolean, default: 1 },
			email: { type: Boolean, default: 1 },
		},
	},
});

module.exports = mongoose.model("User", UserSchema);
