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

const contributingPricesPipeline = (volumeIds) => [
	{ $match: { "ownedVolumes.volume": { $in: volumeIds } } },
	{ $unwind: "$ownedVolumes" },
	{
		$match: {
			"ownedVolumes.volume": { $in: volumeIds },
			"ownedVolumes.purchasePrice": { $gt: 0 },
		},
	},
	{
		$group: {
			_id: "$ownedVolumes.volume",
			prices: {
				$push: {
					price: "$ownedVolumes.purchasePrice",
					condition: "$ownedVolumes.condition",
				},
			},
		},
	},
];

const recomputeVolumePriceStatsMany = async (volumeIds) => {
	const ids = [...new Set((volumeIds || []).filter(Boolean).map(String))].map(
		(id) => new mongoose.Types.ObjectId(id),
	);
	if (ids.length === 0) return;
	const User = mongoose.model("User");
	const Volume = mongoose.model("Volume");

	const rows = await User.aggregate(contributingPricesPipeline(ids));
	const pricesByVolume = new Map(rows.map((row) => [String(row._id), row.prices]));

	await Volume.bulkWrite(
		ids.map((id) => ({
			updateOne: {
				filter: { _id: id },
				update: {
					$set: {
						pricePaidStats: buildStats(pricesByVolume.get(String(id)) || []),
					},
				},
			},
		})),
	);
};

const recomputeVolumePriceStats = (volumeId) =>
	recomputeVolumePriceStatsMany([volumeId]);

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
