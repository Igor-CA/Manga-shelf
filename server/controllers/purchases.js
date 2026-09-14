const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Purchase = require("../models/Purchase");
const User = require("../models/User");
const Volume = require("../models/volume");
const {
	bySegment,
	summarize,
	recomputeVolumePriceStatsMany,
	suppressSparseStats,
} = require("../Utils/priceStats");

exports.getAllSeriesPurchases = asyncHandler(async (req, res) => {
	const seriesId = req.params.seriesId || req.params.id;

	const purchases = await Purchase.find({ series: seriesId })
		.select("amount volumes condition store purchaseDate createdAt")
		.sort({ createdAt: -1 })
		.lean();

	res.json(
		purchases.map((purchase) => ({
			amount: purchase.amount,
			volumes: purchase.volumes,
			condition: purchase.condition,
			store: purchase.store,
			month: (purchase.purchaseDate || purchase.createdAt)
				.toISOString()
				.slice(0, 7),
		})),
	);
});

exports.getSeriesPriceStats = asyncHandler(async (req, res) => {
	const seriesId = req.params.seriesId || req.params.id;

	const volumes = await Volume.find({ serie: seriesId })
		.select("number isVariant variantNumber pricePaidStats")
		.sort({ number: 1 })
		.lean();

	const perVolume = volumes.map((volume) => ({
		volumeId: volume._id,
		volumeNumber: volume.number,
		isVariant: volume.isVariant || false,
		variantNumber: volume.variantNumber,
		stats: suppressSparseStats(volume.pricePaidStats),
	}));

	// Median of the per-volume medians that cleared the threshold, so `count`
	// here is volumes with data rather than contributors.
	const summary = bySegment((segment) =>
		summarize(
			perVolume
				.map((v) => v.stats[segment].median)
				.filter((m) => m != null),
		),
	);

	res.json({ volumes: perVolume, summary });
});

// Current user's purchases for a series
exports.getSeriesPurchases = asyncHandler(async (req, res) => {
	const { seriesId } = req.params;
	const userId = req.user._id;

	const purchases = await Purchase.find({
		user: userId,
		series: seriesId,
	}).sort({ createdAt: -1 });

	res.json(purchases);
});

// A purchase is a receipt, not a source of truth: it writes onto the owned
// volumes it covers and nothing ever reads it back to compute a figure.
// Dropped volume ids arrive as strings, and arrayFilters match on type.
const toObjectIds = (ids) => ids.map((id) => new mongoose.Types.ObjectId(id));

const applyPurchaseToVolumes = async (userId, purchase) => {
	const volumeIds = purchase.volumes;
	if (volumeIds.length === 0) return;

	const pricePerVolume =
		Math.round((purchase.amount / volumeIds.length) * 100) / 100;

	await User.updateOne(
		{ _id: userId },
		{
			$set: {
				"ownedVolumes.$[covered].purchasePrice": pricePerVolume,
				"ownedVolumes.$[covered].lotSize": volumeIds.length,
				"ownedVolumes.$[covered].condition": purchase.condition ?? null,
				"ownedVolumes.$[covered].store": purchase.store ?? null,
				...(purchase.purchaseDate
					? { "ownedVolumes.$[covered].acquiredAt": purchase.purchaseDate }
					: {}),
			},
		},
		{ arrayFilters: [{ "covered.volume": { $in: toObjectIds(volumeIds) } }] },
	);
};

// An edit that drops a volume is a correction: the price this receipt wrote onto
// it was wrong, so it goes with it. Deleting the receipt is not, and leaves
// prices alone.
const clearPurchaseFromVolumes = async (userId, volumeIds) => {
	if (volumeIds.length === 0) return;

	await User.updateOne(
		{ _id: userId },
		{
			$set: {
				"ownedVolumes.$[dropped].purchasePrice": null,
				"ownedVolumes.$[dropped].lotSize": null,
			},
		},
		{ arrayFilters: [{ "dropped.volume": { $in: toObjectIds(volumeIds) } }] },
	);
};

const findVolumesOutsideSeries = async (seriesId, volumeIds) => {
	const matching = await Volume.find({
		_id: { $in: volumeIds },
		serie: seriesId,
	})
		.select("_id")
		.lean();

	const inSeries = new Set(matching.map((volume) => volume._id.toString()));
	return volumeIds.filter((id) => !inSeries.has(id.toString()));
};

exports.createPurchase = asyncHandler(async (req, res) => {
	const { seriesId, amount, volumeIds, purchaseDate, condition, store } =
		req.body;
	const userId = req.user._id;

	const user = await User.findById(userId).select("ownedVolumes.volume");
	if (!user) return res.status(404).json({ msg: "Usuário não encontrado" });

	const ownedVolumeIds = new Set(
		user.ownedVolumes.map((ov) => ov.volume.toString()),
	);
	if (!volumeIds.every((vid) => ownedVolumeIds.has(vid))) {
		return res.status(400).json({
			msg: "Alguns volumes selecionados não estão na sua coleção.",
		});
	}

	const outsiders = await findVolumesOutsideSeries(seriesId, volumeIds);
	if (outsiders.length > 0) {
		return res.status(400).json({
			msg: "Todos os volumes de uma compra devem pertencer à mesma obra.",
		});
	}

	const purchase = await Purchase.create({
		user: userId,
		series: seriesId,
		amount,
		volumes: volumeIds,
		purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
		condition: condition || null,
		store: store || null,
	});

	await applyPurchaseToVolumes(userId, purchase);
	await recomputeVolumePriceStatsMany(volumeIds);

	res.status(201).json(purchase);
});

exports.updatePurchase = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { amount, volumeIds, purchaseDate, condition, store } = req.body;
	const userId = req.user._id;

	const purchase = await Purchase.findById(id);
	if (!purchase) return res.status(404).json({ msg: "Compra não encontrada" });
	if (purchase.user.toString() !== userId.toString()) {
		return res.status(403).json({ msg: "Sem permissão" });
	}

	const outsiders = await findVolumesOutsideSeries(purchase.series, volumeIds);
	if (outsiders.length > 0) {
		return res.status(400).json({
			msg: "Todos os volumes de uma compra devem pertencer à mesma obra.",
		});
	}

	const previousVolumeIds = purchase.volumes.map((v) => v.toString());
	const nextVolumeIds = new Set(volumeIds.map((v) => v.toString()));
	const droppedVolumeIds = previousVolumeIds.filter(
		(v) => !nextVolumeIds.has(v),
	);

	purchase.amount = amount;
	purchase.volumes = volumeIds;
	if (purchaseDate !== undefined) {
		purchase.purchaseDate = purchaseDate ? new Date(purchaseDate) : null;
	}
	if (condition !== undefined) purchase.condition = condition || null;
	if (store !== undefined) purchase.store = store || null;
	await purchase.save();

	await clearPurchaseFromVolumes(userId, droppedVolumeIds);
	await applyPurchaseToVolumes(userId, purchase);
	await recomputeVolumePriceStatsMany([...droppedVolumeIds, ...volumeIds]);

	res.json(purchase);
});

exports.deletePurchase = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const userId = req.user._id;

	const purchase = await Purchase.findById(id);
	if (!purchase) return res.status(404).json({ msg: "Compra não encontrada" });
	if (purchase.user.toString() !== userId.toString()) {
		return res.status(403).json({ msg: "Sem permissão" });
	}

	await purchase.deleteOne();

	res.json({ msg: "Compra removida com sucesso" });
});
