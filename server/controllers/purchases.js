const asyncHandler = require("express-async-handler");
const Purchase = require("../models/Purchase");
const User = require("../models/User");

// All purchases for a series (public, no user info exposed)
exports.getAllSeriesPurchases = asyncHandler(async (req, res) => {
	const seriesId = req.params.seriesId || req.params.id;

	const purchases = await Purchase.find({ series: seriesId })
		.select("amount volumes purchaseDate createdAt")
		.sort({ createdAt: -1 });

	res.json(purchases);
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

exports.createPurchase = asyncHandler(async (req, res) => {
	const { seriesId, amount, volumeIds, purchaseDate } = req.body;
	const userId = req.user._id;

	const user = await User.findById(userId);
	if (!user) return res.status(404).json({ msg: "Usuário não encontrado" });

	// Verify all volumes are owned by user
	const ownedVolumeIds = user.ownedVolumes.map((ov) => ov.volume.toString());
	const allOwned = volumeIds.every((vid) => ownedVolumeIds.includes(vid));
	if (!allOwned) {
		return res.status(400).json({
			msg: "Alguns volumes selecionados não estão na sua coleção.",
		});
	}

	const purchase = await Purchase.create({
		user: userId,
		series: seriesId,
		amount,
		volumes: volumeIds,
		purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
	});

	// Recalculate purchasePrice for all volumes of this series
	await recalculateVolumePrices(userId, seriesId);

	res.status(201).json(purchase);
});

exports.updatePurchase = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { amount, volumeIds, purchaseDate } = req.body;
	const userId = req.user._id;

	const purchase = await Purchase.findById(id);
	if (!purchase) return res.status(404).json({ msg: "Compra não encontrada" });
	if (purchase.user.toString() !== userId.toString()) {
		return res.status(403).json({ msg: "Sem permissão" });
	}

	if (amount !== undefined) purchase.amount = amount;
	if (volumeIds !== undefined) purchase.volumes = volumeIds;
	if (purchaseDate !== undefined) purchase.purchaseDate = purchaseDate ? new Date(purchaseDate) : null;
	await purchase.save();

	await recalculateVolumePrices(userId, purchase.series);

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

	const seriesId = purchase.series;
	await purchase.deleteOne();

	await recalculateVolumePrices(userId, seriesId);

	res.json({ msg: "Compra removida com sucesso" });
});

async function recalculateVolumePrices(userId, seriesId) {
	const purchases = await Purchase.find({ user: userId, series: seriesId });
	const user = await User.findById(userId);

	// Build a map: volumeId -> total price assigned to it
	const volumePriceMap = new Map();

	for (const purchase of purchases) {
		if (purchase.volumes.length === 0) continue;
		const pricePerVol =
			Math.round((purchase.amount / purchase.volumes.length) * 100) / 100;
		for (const volId of purchase.volumes) {
			const key = volId.toString();
			// If a volume appears in multiple purchases, use the latest one
			volumePriceMap.set(key, pricePerVol);
		}
	}

	// Update user's ownedVolumes
	for (const ov of user.ownedVolumes) {
		const price = volumePriceMap.get(ov.volume.toString());
		if (price !== undefined) {
			ov.purchasePrice = price;
		}
	}

	await user.save();
}
