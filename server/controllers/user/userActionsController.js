const User = require("../../models/User");
const asyncHandler = require("express-async-handler");

const { sendNewFollowerNotification } = require("../notifications");
const Series = require("../../models/Series");
const Volumes = require("../../models/volume");

exports.addSeries = asyncHandler(async (req, res, next) => {
	const addedSeriesId = req.body.id;
	if (!addedSeriesId)
		return res.status(400).json({ msg: "Obra não informada" });

	const [user, series] = await Promise.all([
		User.findById(req.user._id),
		Series.findById(req.body.id),
	]);
	if (!user) return res.status(400).json({ msg: "Usuário não encontrado" });
	if (!series) return res.status(400).json({ msg: "Obra não encontrada" });

	const alreadyAdded = user.userList.some(
		(entry) => entry.Series.toString() === req.body.id
	);

	if (alreadyAdded) {
		return res.status(400).json({ msg: "Obra já está na lista" });
	}

	const addedSeries = {
		Series: req.body.id,
		completionPercentage: 0,
		status: "Collecting",
	};
	const inWishList = user.wishList.some(
		(entry) => entry.toString() === req.body.id
	);
	//If series in wishlist remove it
	const newWishlist = user.wishList.filter((seriesId) => {
		return seriesId.toString() !== req.body.id;
	});
	user.wishList = newWishlist;

	user.userList.push(addedSeries);

	await Promise.all([
		Series.findByIdAndUpdate(req.body.id, {
			$inc: { popularity: !inWishList },
		}),
		user.save(),
	]);

	return res.send({ msg: "Obra adicionada com sucesso" });
});

exports.addToWishlist = asyncHandler(async (req, res, next) => {
	const addedSeriesId = req.body.id;
	if (!addedSeriesId)
		return res.status(400).json({ msg: "Obra não informada" });

	const [user, series] = await Promise.all([
		User.findById(req.user._id),
		Series.findById(req.body.id),
	]);
	if (!user) return res.status(400).json({ msg: "Usuário não encontrado" });
	if (!series) return res.status(400).json({ msg: "Obra não encontrada" });
	const alreadyAdded = user.wishList.some(
		(entry) => entry.toString() === req.body.id
	);

	const inUserList = user.userList.some(
		(entry) => entry.Series.toString() === req.body.id
	);

	if (alreadyAdded) {
		return res.status(400).json({ msg: "Obra já está na lista de desejos" });
	}

	if (inUserList) {
		const series = user.userList.find(
			(series) => series.Series._id.toString() === req.body.id
		);
		if (series.completionPercentage !== 0) {
			return res.status(400).json({
				msg: "Você já possui volumes dessa obra portanto ela não foi adicionada à lista de desejos",
			});
		} else {
			const newSeriesList = user.userList.filter((seriesObject) => {
				return seriesObject.Series.toString() !== req.body.id;
			});
			user.userList = newSeriesList;
		}
	}

	user.wishList.push(addedSeriesId);

	await Promise.all([
		Series.findByIdAndUpdate(req.body.id, {
			$inc: { popularity: !inUserList },
		}),
		user.save(),
	]);

	return res.send({ msg: "Obra adicionada com sucesso" });
});

exports.removeSeries = asyncHandler(async (req, res, next) => {
	const seriesId = req.body.id;

	if (!seriesId) return res.status(400).json({ msg: "Obra não informada" });

	const volumesInSeries = await Volumes.find({ serie: seriesId }).select("_id");
	const volumeIdsToDelete = volumesInSeries.map((v) => v._id);

	const userUpdate = await User.updateOne(
		{ _id: req.user._id },
		{
			$pull: {
				userList: { Series: seriesId },
				ownedVolumes: { volume: { $in: volumeIdsToDelete } },
			},
		}
	);

	if (userUpdate.matchedCount === 0)
		return res.status(400).json({ msg: "Usuário não encontrado" });

	const seriesUpdate = await Series.findOneAndUpdate(
		{ _id: seriesId, popularity: { $gt: 0 } },
		{ $inc: { popularity: -1 } }
	);

	if (!seriesUpdate)
		return res.status(400).json({ msg: "Obra não encontrada" });

	return res.send({ msg: "Obra removida com sucesso" });
});
exports.removeFromWishList = asyncHandler(async (req, res, next) => {
	const removedSeriesId = req.body.id;
	if (!removedSeriesId)
		return res.status(400).json({ msg: "Obra não informada" });

	const [user, series] = await Promise.all([
		User.findById(req.user._id, { wishList: 1 }),
		Series.findById(req.body.id),
	]);
	if (!user) return res.status(400).json({ msg: "Usuário não encontrado" });
	if (!series) return res.status(400).json({ msg: "Obra não encontrada" });

	const newWishList = user.wishList.filter((seriesObject) => {
		return seriesObject.toString() !== removedSeriesId;
	});
	user.wishList = newWishList;
	await Promise.all([
		Series.findOneAndUpdate(
			{ _id: req.body.id, popularity: { $gt: 0 } },
			{ $inc: { popularity: -1 } }
		),
		user.save(),
	]);
	return res.send({ msg: "Obra removida com sucesso" });
});

const getNewUserSeriesStatus = (currentStatus, completionPercentage) => {
	if (
		(currentStatus === "Finalizado" || currentStatus === "Cancelado") &&
		completionPercentage === 1
	) {
		return "Finished";
	} else if (completionPercentage === 1) {
		return "Up to date";
	}
	return "Collecting";
};

exports.addVolume = asyncHandler(async (req, res, next) => {
	const { seriesId, amountVolumesFromSeries, idList, seriesStatus } = req.body;

	if (!idList || idList.length === 0)
		return res.status(400).json({ msg: "Volume(s) não informado" });

	const bulkOps = idList.map((id) => ({
		updateOne: {
			filter: {
				_id: req.user._id,
				"ownedVolumes.volume": { $ne: id },
			},
			update: {
				$push: {
					ownedVolumes: {
						volume: id,
						amount: 1,
						acquiredAt: new Date(),
						isRead: false,
					},
				},
			},
		},
	}));

	await Promise.all([
		User.bulkWrite(bulkOps),
		User.updateOne({ _id: req.user._id }, { $pull: { wishList: seriesId } }),
	]);

	const calculationResult = await User.aggregate([
		{ $match: { _id: req.user._id } },
		{
			$lookup: {
				from: "volumes",
				let: { ownedIds: "$ownedVolumes.volume" },
				pipeline: [
					{
						$match: {
							$expr: {
								$and: [
									{ $in: ["$_id", "$$ownedIds"] },
									{ $eq: ["$serie", { $toObjectId: seriesId }] },
								],
							},
						},
					},
					{ $group: { _id: "$number" } },
					{ $count: "count" },
				],
				as: "stats",
			},
		},
		{
			$project: {
				uniqueCount: { $arrayElemAt: ["$stats.count", 0] },
				seriesEntry: {
					$filter: {
						input: "$userList",
						as: "item",
						cond: {
							$eq: ["$$item.Series", { $toObjectId: seriesId }],
						},
					},
				},
			},
		},
	]);

	const uniqueOwnedCount = calculationResult[0]?.uniqueCount || 0;
	const existingSeriesEntry = calculationResult[0]?.seriesEntry?.[0];

	const finalTotal = amountVolumesFromSeries > 0 ? amountVolumesFromSeries : 1;
	let completionPercentage = uniqueOwnedCount / finalTotal;
	if (completionPercentage > 1) completionPercentage = 1;

	const newStatus = getNewUserSeriesStatus(seriesStatus, completionPercentage);
	const updates = [];

	if (!existingSeriesEntry) {
		updates.push(
			User.updateOne(
				{ _id: req.user._id },
				{
					$push: {
						userList: {
							Series: seriesId,
							completionPercentage: completionPercentage,
							status: newStatus,
						},
					},
				}
			)
		);
		updates.push(
			Series.findByIdAndUpdate(seriesId, { $inc: { popularity: 1 } })
		);
	} else {
		updates.push(
			User.updateOne(
				{ _id: req.user._id, "userList.Series": seriesId },
				{
					$set: {
						"userList.$.completionPercentage": completionPercentage,
						"userList.$.status": newStatus,
					},
				}
			)
		);
	}

	await Promise.all(updates);

	res.send({ msg: "Volume(s) Adicionado com sucesso" });
});

exports.removeVolume = asyncHandler(async (req, res, next) => {
	const { seriesId, amountVolumesFromSeries, idList, seriesStatus } = req.body;

	if (!idList || idList.length === 0)
		return res.status(400).json({ msg: "Volume(s) não informado" });

	await User.updateOne(
		{ _id: req.user._id },
		{
			$pull: {
				ownedVolumes: { volume: { $in: idList } },
			},
		}
	);

	const calculationResult = await User.aggregate([
		{ $match: { _id: req.user._id } },
		{
			$lookup: {
				from: "volumes",
				let: { ownedIds: "$ownedVolumes.volume" },
				pipeline: [
					{
						$match: {
							$expr: {
								$and: [
									{ $in: ["$_id", "$$ownedIds"] },
									// FIX: Use $toObjectId to match addVolume logic & avoid deprecation
									{ $eq: ["$serie", { $toObjectId: seriesId }] },
								],
							},
						},
					},
					{ $group: { _id: "$number" } },
					{ $count: "count" },
				],
				as: "stats",
			},
		},
		{
			$project: {
				uniqueCount: { $arrayElemAt: ["$stats.count", 0] },
				seriesEntry: {
					$filter: {
						input: "$userList",
						as: "item",
						cond: {
							$eq: ["$$item.Series", { $toObjectId: seriesId }],
						},
					},
				},
			},
		},
	]);

	const uniqueOwnedCount = calculationResult[0]?.uniqueCount || 0;
	const existingSeriesEntry = calculationResult[0]?.seriesEntry?.[0];

	if (existingSeriesEntry) {
		const finalTotal =
			amountVolumesFromSeries > 0 ? amountVolumesFromSeries : 1;
		let completionPercentage = uniqueOwnedCount / finalTotal;
		if (completionPercentage > 1) completionPercentage = 1;

		const newStatus = getNewUserSeriesStatus(
			seriesStatus,
			completionPercentage
		);

		await User.updateOne(
			{ _id: req.user._id, "userList.Series": seriesId },
			{
				$set: {
					"userList.$.completionPercentage": completionPercentage,
					"userList.$.status": newStatus,
				},
			}
		);
	}

	res.send({ msg: "Volume(s) removido com sucesso" });
});
exports.toggleFollowUser = asyncHandler(async (req, res, next) => {
	const userId = req.user._id;
	const targetUserName = req.body.targetUser;
	const follow = req.body.follow; // true to follow, false to unfollow

	if (!targetUserName) {
		return res.status(400).json({ msg: "Usuário não encontrado" });
	}
	const user = await User.findById(userId);
	const targetUser = await User.findOne({ username: targetUserName });

	if (!targetUser || !user) {
		return res.send({ msg: "Usuário não encontrado" });
	}

	if (user._id.equals(targetUser._id)) {
		return res.status(400).json({ msg: "Não é possível seguir a si mesmo" });
	}

	if (follow) {
		if (!user.following.some((id) => id.equals(targetUser._id))) {
			user.following.push(targetUser._id);
		}
		if (!targetUser.followers.some((id) => id.equals(user._id))) {
			targetUser.followers.push(userId);
		}
		await user.save();
		await targetUser.save();

		sendNewFollowerNotification(user._id, targetUser._id);
		return res.send({ msg: "Seguindo com sucesso" });
	} else {
		user.following = user.following.filter((id) => !id.equals(targetUser._id));
		targetUser.followers = targetUser.followers.filter(
			(id) => !id.equals(user._id)
		);

		await user.save();
		await targetUser.save();
		res.send({ msg: "Deixou de seguir com sucesso" });
	}
});

exports.dropSeries = asyncHandler(async (req, res, next) => {
	const { id: seriesId } = req.body;
	const result = await User.updateOne(
		{ _id: req.user._id, "userList.Series": seriesId },
		{ $set: { "userList.$.status": "Dropped" } }
	);
	if (result.matchedCount === 0) {
		return res
			.status(404)
			.json({ msg: "Série não encontrada na lista do usuário" });
	}
	return res.send({ msg: "Status da série atualizado para 'Dropped'" });
});

exports.undropSeries = asyncHandler(async (req, res, next) => {
	const { id: seriesId } = req.body;
	const result = await User.updateOne(
		{ _id: req.user._id, "userList.Series": seriesId },
		{ $set: { "userList.$.status": "Collecting" } }
	);
	if (result.matchedCount === 0) {
		return res
			.status(404)
			.json({ msg: "Série não encontrada na lista do usuário" });
	}
	return res.send({ msg: "Status da série atualizado para 'Colecionando'" });
});

exports.editOwnedVolumes = asyncHandler(async (req, res, next) => {
	const { acquiredAt, readAt, isRead, readCount, price, amount, notes, _id } =
		req.body;

	const result = await User.updateOne(
		{
			_id: req.user._id,
			"ownedVolumes.volume": _id,
		},
		{
			$set: {
				"ownedVolumes.$.acquiredAt": acquiredAt,
				"ownedVolumes.$.isRead": isRead,
				"ownedVolumes.$.readCount": readCount,
				"ownedVolumes.$.readAt": readAt,
				"ownedVolumes.$.purchasePrice": price,
				"ownedVolumes.$.amount": amount,
				"ownedVolumes.$.notes": notes,
			},
		}
	);

	if (result.matchedCount === 0) {
		return res
			.status(404)
			.json({ msg: "Volume não encontrado na sua coleção." });
	}

	res.json({ msg: "Informações do volume atualizadas com sucesso." });
});
exports.toggleVolumeRead = asyncHandler(async (req, res, next) => {
	const { id } = req.body;

	const user = await User.findOne(
		{ _id: req.user._id, "ownedVolumes.volume": id },
		{ "ownedVolumes.$": 1 }
	);

	if (!user || !user.ownedVolumes || user.ownedVolumes.length === 0) {
		return res.status(404).json({ msg: "Volume não encontrado na coleção." });
	}

	const currentVolume = user.ownedVolumes[0];
	const isCurrentlyRead = currentVolume.isRead;

	let newIsRead, newReadCount, newReadAt;

	if (isCurrentlyRead) {
		newIsRead = false;
		newReadCount = 0;
		newReadAt = null;
	} else {
		newIsRead = true;
		newReadCount = 1;
		newReadAt = new Date();
	}

	await User.updateOne(
		{ _id: req.user._id, "ownedVolumes.volume": id },
		{
			$set: {
				"ownedVolumes.$.isRead": newIsRead,
				"ownedVolumes.$.readCount": newReadCount,
				"ownedVolumes.$.readAt": newReadAt,
			},
		}
	);

	res.json({
		msg: "Status de leitura atualizado.",
	});
});
exports.getNewUserSeriesStatus = getNewUserSeriesStatus;
