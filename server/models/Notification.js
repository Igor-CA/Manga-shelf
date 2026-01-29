const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NotificationsSchema = new Schema(
	{
		group: {
			type: String,
			required: true,
			enum: ["media", "social", "system"],
			index: true,
		},
		eventKey: {
			type: String,
			required: true,
			index: true,
		},
		text: { type: String, required: true },
		imageUrl: { type: String },
		details: [{ type: String }],
		associatedObject: {
			type: mongoose.Schema.Types.ObjectId,
			refPath: "objectType",
		},
		objectType: { type: String, enum: ["User", "Volume", "Series"] },
	},
	{ timestamps: true },
);

module.exports = mongoose.model("Notifications", NotificationsSchema);
