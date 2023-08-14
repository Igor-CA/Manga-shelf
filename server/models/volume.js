const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const VolumeSchema = new Schema({
	serie: { type: Schema.Types.ObjectId, ref: "Series" },
	number: { type: Number, required: true },
	pagesNumber: { type: Number },
	date: { type: String },
	summary: [{ type: String }], //Separated by paragraphs
	defaultPrice: { type: String },
});

module.exports = mongoose.model("Volume", VolumeSchema);

const generateVolumeURL = () => {};
