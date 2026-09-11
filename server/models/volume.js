const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PriceSegmentSchema = new Schema(
	{
		median: { type: Number, default: null },
		count: { type: Number, default: 0 },
	},
	{ _id: false },
);

const VolumeSchema = new Schema(
	{
		serie: { type: Schema.Types.ObjectId, ref: "Series" },
		number: { type: Number, required: true },
		ISBN: { type: String },
		pagesNumber: { type: Number },
		date: { type: Date },
		summary: [{ type: String }], //Separated by paragraphs
		defaultPrice: { type: Number },
		freebies: [{ type: String }],
		isVariant: { type: Boolean, default: false },
		variantNumber: { type: Number, default: 1 },
		chapters: { type: String },
		ratingAverage: { type: Number, default: 0 },
		ratingCount: { type: Number, default: 0 },
		pricePaidStats: {
			novo: { type: PriceSegmentSchema, default: () => ({}) },
			usado: { type: PriceSegmentSchema, default: () => ({}) },
			geral: { type: PriceSegmentSchema, default: () => ({}) },
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Volume", VolumeSchema);
