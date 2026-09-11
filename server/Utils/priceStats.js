const mongoose = require("mongoose");
const { MIN_PRICE_CONTRIBUTORS } = require("./priceConstants");

const median = (sortedPrices) => {
	const middle = Math.floor(sortedPrices.length / 2);
	const value =
		sortedPrices.length % 2 === 0
			? (sortedPrices[middle - 1] + sortedPrices[middle]) / 2
			: sortedPrices[middle];
	return Math.round(value * 100) / 100;
};

const emptySegment = () => ({ median: null, count: 0 });

const emptyStats = () => ({
	novo: emptySegment(),
	usado: emptySegment(),
	geral: emptySegment(),
});

// OwnedVolumeSchema is keyed on volume, so one user contributes at most one
// price per volume and a row count is a contributor count.
const buildStats = (rows) => {
	const buckets = { novo: [], usado: [], geral: [] };

	for (const { price, condition } of rows) {
		buckets.geral.push(price);
		if (condition === "novo" || condition === "usado") {
			buckets[condition].push(price);
		}
	}

	const stats = emptyStats();
	for (const [segment, prices] of Object.entries(buckets)) {
		if (prices.length === 0) continue;
		prices.sort((a, b) => a - b);
		stats[segment] = { median: median(prices), count: prices.length };
	}
	return stats;
};

const contributingPricesPipeline = (volumeMatch) => [
	{ $match: { "ownedVolumes.volume": volumeMatch } },
	{ $unwind: "$ownedVolumes" },
	{
		$match: {
			"ownedVolumes.volume": volumeMatch,
			"ownedVolumes.purchasePrice": { $gt: 0 },
		},
	},
	{
		$project: {
			_id: 0,
			volume: "$ownedVolumes.volume",
			price: "$ownedVolumes.purchasePrice",
			condition: "$ownedVolumes.condition",
		},
	},
];

const recomputeVolumePriceStats = async (volumeId) => {
	if (!volumeId) return;
	const User = mongoose.model("User");
	const Volume = mongoose.model("Volume");

	const id = new mongoose.Types.ObjectId(volumeId);
	const rows = await User.aggregate(contributingPricesPipeline(id));

	await Volume.updateOne(
		{ _id: id },
		{ $set: { pricePaidStats: buildStats(rows) } },
	);
};

const recomputeVolumePriceStatsMany = async (volumeIds) => {
	const unique = [...new Set((volumeIds || []).filter(Boolean).map(String))];
	for (const volumeId of unique) {
		await recomputeVolumePriceStats(volumeId);
	}
};

const suppressSparseStats = (stats) => {
	const source = stats || emptyStats();
	const result = emptyStats();

	for (const segment of ["novo", "usado", "geral"]) {
		const value = source[segment];
		if (value && value.count >= MIN_PRICE_CONTRIBUTORS) {
			result[segment] = { median: value.median, count: value.count };
		}
	}
	return result;
};

module.exports = {
	buildStats,
	contributingPricesPipeline,
	emptyStats,
	recomputeVolumePriceStats,
	recomputeVolumePriceStatsMany,
	suppressSparseStats,
};
