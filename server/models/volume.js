const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const VolumeSchema = new Schema({
	serie: { type: Schema.Types.ObjectId, ref: "Series" },
	number: { type: Number, required: true },
	ISBN: {type:String},
	pagesNumber: { type: Number },	
	date: { type: String },
	summary: [{ type: String }], //Separated by paragraphs
	defaultPrice: { type: String },
	freebies: [{type:String}],
	isVariant: {type: Boolean, default: false},
	variantNumber: {type: Number},
	chapters: {type: String}
}, {timestamps: true});

module.exports = mongoose.model("Volume", VolumeSchema);

const generateVolumeURL = () => {};
