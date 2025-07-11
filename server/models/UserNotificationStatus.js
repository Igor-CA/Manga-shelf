const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserNotificationStatus = new Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		notification: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Notifications",
			required: true,
		},
		siteStatus: {
			type: String,
			enum: ["pending", "sent", "disabled"],
			default: "pending",
		},
		emailStatus: {
			type: String,
			enum: ["pending", "sent", "disabled"],
			default: "pending",
		},
	},
	{ timestamps: true }
);

UserNotificationStatus.index({ user: 1, siteStatus: 1 });
UserNotificationStatus.index({ user: 1, emailStatus: 1 });

module.exports = mongoose.model(
	"UserNotificationStatus",
	UserNotificationStatus
);	
