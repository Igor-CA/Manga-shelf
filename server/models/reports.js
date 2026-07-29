const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReportSchema = new Schema({
	type: { type: String, required: true },
	local: { type: String, required: true },
	page: { type: String, required: true },
	details: { type: String, required: true },
	user: {type: String},
	userId: {type: Schema.Types.ObjectId, ref: "User", default: null},
	wantAnswer: {type: Boolean, default: false}
}, { timestamps: true });

module.exports = mongoose.model("Report", ReportSchema);