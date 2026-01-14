require("dotenv").config();
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SeriesSchema = new Schema(
	{
		title: { type: String, required: true, index: true },
		synonyms: [{ type: String }],
		authors: [{ type: String }],
		demographic: {
			type: String,
			enum: ["Shounen", "Seinen", "Shoujo", "Josei", "Kodomo"],
		},
		genres: [{ type: String }],
		summary: [{ type: String }],
		type: { type: String }, //one shot, manga, Light novel
		publisher: { type: String, required: true },
		status: {
			type: String,
			enum: [
				"Em andamento",
				"Em publicação",
				"Finalizado",
				"Hiatus",
				"Cancelado",
			],
		},
		dates: {
			publishedAt: { type: Date },
			finishedAt: { type: Date },
		},

		specs: {
			format: { type: String },
			volumesInFormat: { type: Number, default: 1 },
			paper: { type: String },
			cover: { type: String },
			dimensions: {
				width: { type: Number },
				height: { type: Number },
			},
		},

		originalRun: {
			publisher: { type: String },
			country: { type: String },
			status: { type: String },
			dates: {
				publishedAt: { type: Date },
				finishedAt: { type: Date },
			},
			totalVolumes: { type: Number },
			totalChapters: { type: Number },
		},

		volumes: [{ type: Schema.Types.ObjectId, ref: "Volume", required: true }],
		relatedSeries: [
			{
				series: { type: Schema.Types.ObjectId, ref: "Series" },
				relation: { type: String },
			},
		],

		isAdult: { type: Boolean, default: false },
		ageRating: { type: String },
		anilistId: { type: Number },
		popularity: { type: Number, default: 0 },

		// System flags
		shouldBeUpdated: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

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
