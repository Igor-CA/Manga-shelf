const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReportSchema = new Schema({
	type: { type: String, required: true },
	local: { type: String, required: true },
	page: { type: String, required: true },
	details: { type: String, required: true },
	user: {type: String} 
});

module.exports = mongoose.model("Report", ReportSchema);