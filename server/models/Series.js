require("dotenv").config();
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SeriesSchema = new Schema({
	title: { type: String, required: true },
	authors: [{ type: String }],
	publisher: { type: String, required: true },
	volumes: [{ type: Schema.Types.ObjectId, ref: "Volume", required: true }],
	dimmensions: [{ type: Number }],
	status: { type: String },
	synonyms: [{ type: String }],
	genres: [{ type: String }],
	summary: [{ type: String }], //Separated by paragraphs
	isAdult: { type: Boolean },
	anilistId: { type: Number },
	popularity: { type: Number, default: 0 },
});

SeriesSchema.virtual("seriesCover").get(function () {
	const sanitizedTitle = this.title
		.replace(/[?:/–\s]+/g, "-")
		.replace(/-+/g, "-");
	const nameURL = encodeURIComponent(sanitizedTitle);
	return `cover-${nameURL}-1.webp`;
});

SeriesSchema.set("toObject", { virtuals: true });
SeriesSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Series", SeriesSchema);
