const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NotificationsSchema = new Schema({
	type: { type: String, required: true },
	text: { type: String, required: true },
	imageUrl: { type: String},
	details: [{ type: String}],
	associatedObject: { type: mongoose.Schema.Types.ObjectId, refPath: 'objectType' },
    objectType: { type: String, enum: ['User', 'Volume', 'Series'] }, 
});

module.exports = mongoose.model("Notifications", NotificationsSchema);
