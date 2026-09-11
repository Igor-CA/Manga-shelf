const mongoose = require("mongoose");
const {
	MIN_PRICE_CONTRIBUTORS,
	VOLUME_CONDITIONS,
} = require("./priceConstants");

const PRICE_SEGMENTS = [...VOLUME_CONDITIONS, "geral"];

const median = (values) => {
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	const value =
		sorted.length % 2 === 0
			? (sorted[middle - 1] + sorted[middle]) / 2
			: sorted[middle];
	return Math.round(value * 100) / 100;
};

const emptySegment = () => ({ median: null, count: 0 });

const summarize = (values) =>
	values.length > 0
		? { median: median(values), count: values.length }
		: emptySegment();

const bySegment = (fn) =>
	Object.fromEntries(PRICE_SEGMENTS.map((segment) => [segment, fn(segment)]));

const emptyStats = () => bySegment(emptySegment);

const buildStats = (rows) =>
	bySegment((segment) =>
		summarize(
			rows
				.filter((row) => segment === "geral" || row.condition === segment)
				.map((row) => row.price),
		),
	);

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

const suppressSparseStats = (stats) =>
	bySegment((segment) => {
		const value = stats?.[segment];
		return value?.count >= MIN_PRICE_CONTRIBUTORS
			? { median: value.median, count: value.count }
			: emptySegment();
	});

module.exports = {
	bySegment,
	summarize,
	buildStats,
	contributingPricesPipeline,
	emptyStats,
	recomputeVolumePriceStats,
	recomputeVolumePriceStatsMany,
	suppressSparseStats,
};
