const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LinkProviderSchema = new Schema(
	{
		key: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		name: { type: String, required: true, trim: true },
		// info = a data source, shown as a chip on the series page.
		// store = a place to buy, shown in the volume's "Onde comprar" block.
		category: { type: String, required: true, enum: ["info", "store"] },
		icon: { type: String, required: true },
		brandColor: { type: String, required: true },
		urlTemplate: { type: String, required: true },
		affiliateTemplate: { type: String, default: null },
		active: { type: Boolean, default: true },
	},
	{ timestamps: true },
);

module.exports = mongoose.model("LinkProvider", LinkProviderSchema);
