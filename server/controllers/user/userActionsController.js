const User = require("../../models/User");
const asyncHandler = require("express-async-handler");

const { sendNewFollowerNotification } = require("../notifications");
const Series = require("../../models/Series");

exports.addSeries = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user._id);

	if (!user) return res.status(400).json({ msg: "Usuário não encontrado" });

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
	const user = await User.findById(req.user._id);
	const addedSeries = req.body.id;
	if (!user) return res.status(400).json({ msg: "Usuário não encontrado" });
	if (!addedSeries) return res.status(400).json({ msg: "Obra não informada" });

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

	user.wishList.push(addedSeries);

	await Promise.all([
		Series.findByIdAndUpdate(req.body.id, {
			$inc: { popularity: !inUserList },
		}),
		user.save(),
	]);

	return res.send({ msg: "Obra adicionada com sucesso" });
});

exports.removeSeries = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user._id, {
		ownedVolumes: 1,
		userList: 1,
	}).populate({
		path: "ownedVolumes",
		select: "serie",
	});
	if (!user) return res.status(400).json({ msg: "Usuário não encontrado" });

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
	const user = await User.findById(req.user._id, {
		wishList: 1,
	});
	if (!user) return res.status(400).json({ msg: "Usuário não encontrado" });

	const removedSeries = req.body.id;
	if (!removedSeries)
		return res.status(400).json({ msg: "Obra não informada" });

	const newWishList = user.wishList.filter((seriesObject) => {
		return seriesObject.toString() !== removedSeries;
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

exports.getNewUserSeriesStatus = (currentStatus, completionPercentage) => {
	if (
		(currentStatus === "Finalizado" || currentStatus === "Cancelado") &&
		completionPercentage === 1
	) {
		return "Finished";
	} else if (completionPercentage === 1) {
		return "Up to date";
	}
	return "Collecting";
}

exports.addVolume = asyncHandler(async (req, res, next) => {
	const { seriesId, amountVolumesFromSeries, idList, seriesStatus } = req.body;
	const user = await User.findById(req.user._id, {
		ownedVolumes: 1,
		userList: 1,
		wishList: 1,
	}).populate("userList.Series");
	if (!user) return res.status(400).json({ msg: "Usuário não encontrado" });

	//Add all volumes to ownedVolumes
	const ownedSet = new Set(user.ownedVolumes.map((id) => id.toString()));
	idList.forEach((id) => ownedSet.add(id));
	user.ownedVolumes = Array.from(ownedSet);

	let seriesEntry = user.userList.find(
		(s) => s.Series._id.toString() === seriesId
	);
	const inUserList = seriesEntry !== undefined;
	const inWishList = user.wishList.some(
		(entry) => entry.toString() === seriesId
	);

	if (!seriesEntry) {
		//Add series to userList
		const completionPercentage = idList.length / amountVolumesFromSeries;
		user.userList.push({
			Series: seriesId,
			completionPercentage: completionPercentage,
			status: getNewUserSeriesStatus(seriesStatus, completionPercentage)
		});
		//If series in wishlist remove it
		const newWishlist = user.wishList.filter((wishListSeriesId) => {
			return wishListSeriesId.toString() !== seriesId;
		});
		user.wishList = newWishlist;
	} else {
		const allVolumes = seriesEntry.Series.volumes.map((id) => id.toString());
		const ownedFromSeries = allVolumes.filter((volId) => ownedSet.has(volId));
		const completionPercentage = ownedFromSeries.length / allVolumes.length;
		seriesEntry.completionPercentage = completionPercentage
		seriesEntry.status = getNewUserSeriesStatus(seriesStatus, completionPercentage);
	}

	await Promise.all([
		Series.findByIdAndUpdate(seriesId, {
			$inc: { popularity: !inUserList && !inWishList },
		}),
		user.save(),
	]);
	res.send({ msg: "Volume(s) Adicionado com sucesso" });
});

exports.removeVolume = asyncHandler(async (req, res, next) => {
	const { seriesId, idList } = req.body;
	const user = await User.findById(req.user._id, {
		ownedVolumes: 1,
		userList: 1,
	}).populate("userList.Series");
	if (!user) return res.status(400).json({ msg: "Usuário não encontrado" });

	//Filter out all volumes from ownedVolumes
	const ownedSet = new Set(user.ownedVolumes.map((id) => id.toString()));
	idList.forEach((id) => ownedSet.delete(id)); // Remove specified volumes
	user.ownedVolumes = Array.from(ownedSet);

	//Calculate New percentage
	const seriesEntry = user.userList.find(
		(s) => s.Series._id.toString() === seriesId
	);

	if (seriesEntry) {
		const allVolumes = seriesEntry.Series.volumes.map((id) => id.toString());
		const ownedFromSeries = allVolumes.filter((volId) => ownedSet.has(volId));
		seriesEntry.completionPercentage =
			ownedFromSeries.length / allVolumes.length;
		seriesEntry.status = "Collecting"
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
