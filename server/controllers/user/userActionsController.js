const User = require("../../models/User");
const asyncHandler = require("express-async-handler");

const { sendNewFollowerNotification } = require("../notifications");

exports.addSeries = asyncHandler(async (req, res, next) => {
	const addedSeries = { Series: req.body.id };
	await User.findByIdAndUpdate(req.user._id, {
		$push: { userList: addedSeries },
	});
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
	await user.save();
	return res.send({ msg: "Obra removida com sucesso" });
});

exports.addVolume = asyncHandler(async (req, res, next) => {
	const { seriesId, amountVolumesFromSeries, idList } = req.body;

	const user = await User.findById(req.user._id, {
		ownedVolumes: 1,
		userList: 1,
	}).populate("userList.Series");
	if (!user) return res.status(400).json({ msg: "Usuário não encontrado" });

	//Add all volumes to ownedVolumes
	const ownedSet = new Set(user.ownedVolumes.map((id) => id.toString()));
	idList.forEach((id) => ownedSet.add(id));
	user.ownedVolumes = Array.from(ownedSet);

	let seriesEntry = user.userList.find(
		(s) => s.Series._id.toString() === seriesId
	);

	if (!seriesEntry) {
		//Add series to userList
		user.userList.push({
			Series: seriesId,
			completionPercentage: idList.length / amountVolumesFromSeries,
		});
	} else {
		const allVolumes = seriesEntry.Series.volumes.map((id) => id.toString());
		const ownedFromSeries = allVolumes.filter((volId) => ownedSet.has(volId));
		seriesEntry.completionPercentage =
			ownedFromSeries.length / allVolumes.length;
	}

	await user.save();
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
