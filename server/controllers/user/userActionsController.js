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
	const removedSeriesId = req.body.id;
	if (!removedSeriesId)
		return res.status(400).json({ msg: "Obra não informada" });

	const [user, series] = await Promise.all([
		User.findById(req.user._id, {
			ownedVolumes: 1,
			userList: 1,
		}).populate({
			path: "ownedVolumes",
			select: "serie",
		}),
		Series.findById(req.body.id),
	]);
	if (!user) return res.status(400).json({ msg: "Usuário não encontrado" });
	if (!series) return res.status(400).json({ msg: "Obra não encontrada" });

	const newSeriesList = user.userList.filter((seriesObject) => {
		return seriesObject.Series.toString() !== req.body.id;
	});
	const newVolumesList = user.ownedVolumes.filter((volume) => {
		return volume.serie.toString() !== req.body.id;
	});
	user.userList = newSeriesList;
	user.ownedVolumes = newVolumesList;
	await Promise.all([
		Series.findOneAndUpdate(
			{ _id: req.body.id, popularity: { $gt: 0 } },
			{ $inc: { popularity: -1 } }
		),
		user.save(),
	]);
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

	const [user, volumesFound] = await Promise.all([
		User.findById(req.user._id, {
			ownedVolumes: 1,
			userList: 1,
			wishList: 1,
		}).populate("userList.Series"),
		Volumes.find({ _id: { $in: idList } }),
	]);

	if (!user) return res.status(400).json({ msg: "Usuário não encontrado" });
	if (!volumesFound || volumesFound.length === 0)
		return res.status(400).json({ msg: "Volume(s) não encontrado" });

	const ownedIdsSet = new Set(user.ownedVolumes.map((id) => id.toString()));
	idList.forEach((id) => ownedIdsSet.add(id));
	user.ownedVolumes = Array.from(ownedIdsSet);

	const ownedVolumesDocs = await Volumes.find({
		serie: seriesId,
		_id: { $in: Array.from(ownedIdsSet) },
	}).select("number");

	const uniqueOwnedCount = new Set(ownedVolumesDocs.map((v) => v.number)).size;

	const finalTotal = amountVolumesFromSeries > 0 ? amountVolumesFromSeries : 1;
	let completionPercentage = uniqueOwnedCount / finalTotal;
	if (completionPercentage > 1) completionPercentage = 1;

	let seriesEntry = user.userList.find(
		(s) => s.Series._id.toString() === seriesId
	);
	const inWishList = user.wishList.some(
		(entry) => entry.toString() === seriesId
	);

	const shouldIncrementPopularity = !seriesEntry && !inWishList;

	if (!seriesEntry) {
		user.userList.push({
			Series: seriesId,
			completionPercentage: completionPercentage,
			status: getNewUserSeriesStatus(seriesStatus, completionPercentage),
		});

		if (inWishList) {
			user.wishList = user.wishList.filter((wishListSeriesId) => {
				return wishListSeriesId.toString() !== seriesId;
			});
		}
	} else {
		seriesEntry.completionPercentage = completionPercentage;
		seriesEntry.status = getNewUserSeriesStatus(
			seriesStatus,
			completionPercentage
		);
	}

	await Promise.all([
		Series.findByIdAndUpdate(seriesId, {
			$inc: { popularity: shouldIncrementPopularity },
		}),
		user.save(),
	]);

	res.send({ msg: "Volume(s) Adicionado com sucesso" });
});

exports.removeVolume = asyncHandler(async (req, res, next) => {
	const { seriesId, amountVolumesFromSeries, idList, seriesStatus } = req.body;

	if (!idList || idList.length === 0)
		return res.status(400).json({ msg: "Volume(s) não informado" });

	const user = await User.findById(req.user._id, {
		ownedVolumes: 1,
		userList: 1,
	}).populate("userList.Series");

	if (!user) return res.status(400).json({ msg: "Usuário não encontrado" });

	const ownedIdsSet = new Set(user.ownedVolumes.map((id) => id.toString()));
	idList.forEach((id) => ownedIdsSet.delete(id));

	user.ownedVolumes = Array.from(ownedIdsSet);

	const seriesEntry = user.userList.find(
		(s) => s.Series._id.toString() === seriesId
	);

	if (seriesEntry) {
		const remainingVolumesDocs = await Volumes.find({
			serie: seriesId,
			_id: { $in: Array.from(ownedIdsSet) },
		}).select("number");
		const uniqueOwnedCount = new Set(remainingVolumesDocs.map((v) => v.number))
			.size;

		const finalTotal =
			amountVolumesFromSeries > 0 ? amountVolumesFromSeries : 1;
		let completionPercentage = uniqueOwnedCount / finalTotal;

		if (completionPercentage > 1) completionPercentage = 1;

		seriesEntry.completionPercentage = completionPercentage;

		seriesEntry.status = getNewUserSeriesStatus(
			seriesStatus,
			completionPercentage
		);
	}

	await user.save();
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

exports.getNewUserSeriesStatus = getNewUserSeriesStatus;
