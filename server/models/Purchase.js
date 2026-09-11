const mongoose = require("mongoose");
const { VOLUME_CONDITIONS } = require("../Utils/priceConstants");
const Schema = mongoose.Schema;

const PurchaseSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		series: {
			type: Schema.Types.ObjectId,
			ref: "Series",
			required: true,
		},
		amount: {
			type: Number,
			required: true,
			min: 0,
		},
		purchaseDate: {
			type: Date,
		},
		condition: {
			type: String,
			enum: VOLUME_CONDITIONS,
			default: null,
		},
		store: {
			type: String,
			default: null,
		},
		volumes: [
			{
				type: Schema.Types.ObjectId,
				ref: "Volume",
			},
		],
	},
	{ timestamps: true },
);

PurchaseSchema.index({ user: 1, series: 1 });
PurchaseSchema.index({ series: 1, createdAt: -1 });
PurchaseSchema.index({ user: 1 });
PurchaseSchema.index({ volumes: 1 });

module.exports = mongoose.model("Purchase", PurchaseSchema);
