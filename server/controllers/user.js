const User = require("../models/User");
const {
	getVolumeCoverURL,
	getSeriesCoverURL,
} = require("../Utils/getCoverFunctions");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const ITEMS_PER_PAGE = 36;
const path = require("path");

const multer = require("multer");
const mime = require("mime-types");

const { sendNewFollowerNotification } = require("./notifications");
const { sendEmail } = require("../Utils/sendEmail");
function configureMulter(folder) {
	const storage = multer.diskStorage({
		destination: (req, file, cb) => cb(null, path.resolve(folder)),
		filename: (req, file, cb) => {
			const userId = req.user._id;
			const fileExtension = mime.extension(file.mimetype) || "webp";
			cb(null, `${userId}.${fileExtension}`);
		},
	});

	const fileFilter = (req, file, cb) => {
		const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
		if (!allowedTypes.includes(file.mimetype)) {
			return cb(new Error("Invalid file type. Only JPEG, PNG, and WEBP are allowed."), false);
		}
		cb(null, true);
	};

	return multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });
}


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

exports.getLoggedUser = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user._id)
		.populate({
			path: "userList.Series",
			select: "title",
		})
		.lean()
		.exec();

	if (!user) return res.send({ msg: "Usuário não encontrado" });

	const notificationCount =
		user.notifications?.reduce((count, currentNotification) => {
			return count + (!currentNotification.seen ? 1 : 0);
		}, 0) ?? 0;

	const userInfo = {
		_id: user._id,
		username: user.username,
		userList: user.userList,
		ownedVolumes: user.ownedVolumes,
		profileImageUrl: user.profileImageUrl,
		profileBannerUrl: user.profileBannerUrl,
		settings: user.settings,
		email: user.email,
		allowAdult: user.allowAdult,
		notificationCount,
	};
	return res.send(userInfo);
});

exports.getUserCollection = asyncHandler(async (req, res, next) => {
	const targetUser = req.params.username?.trim();
	if (!targetUser)
		return res.status(400).send({ msg: "Usuário não encontrado" });

	const page = parseInt(req.query.p) || 1;
	const skip = ITEMS_PER_PAGE * (page - 1);
	const filter = buildFilter(req.query);
	const sortStage = buildSortStage(req.query.ordering || "title");
	const allowAdult = req.user?.allowAdult || false;
	const pipeline = buildAggregationPipeline(targetUser, allowAdult, filter, sortStage, skip);
	const userCollection = await User.aggregate(pipeline);
	const filteredList = userCollection.map((series) => {
		return {
			...series,
			image: getSeriesCoverURL(series),
		};
	});

	res.send(filteredList);
});

//Filters for building search pipeline

const buildFilter = ({ publisher, genre, search }) => {
	const filter = {};
	if (genre) filter["userList.Series.genres"] = { $in: [genre] };
	if (publisher) filter["userList.Series.publisher"] = publisher;
	if (search) {
		const searchRegex = { $regex: search, $options: "i" };
		filter.$or = [
			{ "userList.Series.title": searchRegex },
			{ "userList.Series.synonyms": searchRegex },
			{ "userList.Series.authors": searchRegex },
		];
	}
	return filter;
};

const buildSortStage = (ordering) => {
	const sortOptions = {
		title: "userList.Series.title",
		publisher: "userList.Series.publisher",
		volumes: "volumesLength",
		status: "userList.completionPercentage",
		timestamp: "userList.timestamp",
	};

	const sortStage = {
		[sortOptions[ordering]]: 1,
		"userList.Series.title": 1,
	};
	return sortStage;
};

const buildAggregationPipeline = (targetUser, allowAdult, filter, sortStage, skip) => {
	const pipeline = [
		{ $match: { username: targetUser } },
		{
			$project: {
				userList: {
					$filter: {
						input: "$userList",
						as: "item",
						cond: { $ne: ["$$item.Series", null] },
					},
				},
			},
		},
		{ $unwind: "$userList" },
		{
			$lookup: {
				from: "series",
				localField: "userList.Series",
				foreignField: "_id",
				as: "userList.Series",
			},
		},
		{ $unwind: "$userList.Series" },
		{
			$addFields: {
				volumesLength: { $size: "$userList.Series.volumes" },
			},
		},
		{ $match: filter },
		{ $sort: sortStage },
		{
			$project: {
				_id: "$userList.Series._id",
				title: "$userList.Series.title",
				completionPercentage: "$userList.completionPercentage",
				isAdult: "$userList.Series.isAdult",
			},
		},
		{ $skip: skip },
		{ $limit: ITEMS_PER_PAGE },
	];

	// Apply adult content filtering if necessary
	if (!allowAdult) {
		pipeline.splice(6, 0, { $match: { "userList.Series.isAdult": false } });
	}

	return pipeline;
};

exports.getMissingPage = asyncHandler(async (req, res, next) => {
	const targetUser = req.params.username?.trim();
	if (!targetUser)
		return res.status(400).send({ msg: "Usuário não encontrado" });

	const page = parseInt(req.query.p) || 1;
	const skip = ITEMS_PER_PAGE * (page - 1);

	const aggregationPipeline = [
		// Match the user by username
		{ $match: { username: targetUser } },
		// Unwind userList to process individual series
		{ $unwind: "$userList" },
		// Lookup the series details
		{
			$lookup: {
				from: "series",
				localField: "userList.Series",
				foreignField: "_id",
				as: "seriesDetails",
			},
		},
		{ $unwind: "$seriesDetails" },
		// Lookup to get volume details
		{
			$lookup: {
				from: "volumes",
				localField: "seriesDetails.volumes",
				foreignField: "_id",
				as: "volumeDetails",
			},
		},
		{ $unwind: "$volumeDetails" },
		// Prepare the list of owned volume IDs
		{
			$addFields: {
				ownedVolumesSet: { $setUnion: ["$ownedVolumes", []] },
			},
		},
		// Add a field to indicate whether the volume is owned or not
		{
			$addFields: {
				isOwned: {
					$cond: [
						{ $in: ["$volumeDetails._id", "$ownedVolumesSet"] },
						true,
						false,
					],
				},
			},
		},
		// Filter out volumes that are owned
		{ $match: { isOwned: false } },
		// Group back the data
		{
			$group: {
				_id: "$volumeDetails._id",
				series: { $first: "$seriesDetails.title" },
				volumeId: { $first: "$volumeDetails._id" },
				volumeNumber: { $first: "$volumeDetails.number" },
			},
		},
		// Sort the results by series title and volume number
		{
			$sort: {
				series: 1,
				volumeNumber: 1,
			},
		},
		// Pagination
		{ $skip: skip },
		{ $limit: ITEMS_PER_PAGE },
	];
	const missingVolumesList = await User.aggregate(aggregationPipeline).exec();
	const listWithImages = missingVolumesList.map((volume) => {
		const seriesObject = { title: volume.series };
		return {
			...volume,
			title: volume.series,
			image: getVolumeCoverURL(seriesObject, volume.volumeNumber),
		};
	});
	res.send(listWithImages);
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
		const allVolumes = seriesEntry.Series.volumes.map((id) =>
			id.toString()
		);
		const ownedFromSeries = allVolumes.filter((volId) =>
			ownedSet.has(volId)
		);
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
	const seriesEntry = user.userList.find((s) => s.Series._id.toString() === seriesId);

	if (seriesEntry) {
		const allVolumes = seriesEntry.Series.volumes.map((id) => id.toString());
		const ownedFromSeries = allVolumes.filter((volId) => ownedSet.has(volId));
		seriesEntry.completionPercentage = ownedFromSeries.length / allVolumes.length;
	}

	await user.save();
	res.send({ msg: "Volume(s) removido com sucesso" });
});

exports.setUserName = asyncHandler(async (req, res, next) => {
	const user = await User.findOne({ username: req.body.username });
	if (user) {
		return res.status(409).json({ msg: "Nome de usuário já existe" });
	}

	await User.findByIdAndUpdate(req.user._id, {
		username: req.body.username,
	});
	res.send({ msg: "Nome atualizado com sucesso" });
});
const uploaders = {
	avatar: configureMulter("public/images/avatar"),
	banner: configureMulter("public/images/banner"),
};
 
function changeUserImage(type, field) {
	if (!uploaders[type]) {
		throw new Error(`Invalid image type: ${type}`);
	}
	return [
		uploaders[type].single("file"),
		asyncHandler(async (req, res) => {
			const user = await User.findById(req.user._id);
			user[field] = `/images/${type}/${req.file.filename}`;
			await user.save();
			res.status(201).json(user);
		}),
	];
}
exports.changeProfilePicture = changeUserImage("avatar", "profileImageUrl");
exports.changeProfileBanner = changeUserImage("banner", "profileBannerUrl");

exports.getUserInfo = asyncHandler(async (req, res, next) => {

	const targetUser = req.params.username;
	if (!targetUser) return res.send({ msg: "Nenhum usuário informado" });

	const user = await User.findOne(
		{ username: targetUser },
		{ profileImageUrl: 1, username: 1, profileBannerUrl: 1 }
	);
	const following = req.user?.following.includes(user._id);
	const userInfo = { ...user._doc, following };
	if (!user) return res.status(400).json({ msg: "User not found" });

	res.send(userInfo);
});
exports.searchUser = asyncHandler(async (req, res, next) => {

	const regex = new RegExp(req.query.q, "i");
	const page = parseInt(req.query.p) || 1;
	const users_per_page = 12;
	const skip = users_per_page * (page - 1);
	const user = await User.aggregate([
		{ $match: { username: regex } },
		{
			$addFields: {
				followersCount: { $size: { $ifNull: ["$followers", []] } },
			},
		},
		{ $sort: { followersCount: -1, username: 1 } },
		{ $skip: skip },
		{ $limit: users_per_page },
	]).collation({ locale: "en", strength: 2 });
	if (!user) return res.status(400).json({ msg: "User not found" });

	res.send(user);
});

exports.getUserStats = asyncHandler(async (req, res, next) => {
	const targetUser = req.params.username?.trim();
	if (!targetUser)
		return res.status(400).send({ msg: "Usuário não encontrado" });
	
	
	const getVolumesStats = (groupField) => [
		{ $match: { username: targetUser } },
		{ $unwind: { path: "$ownedVolumes", preserveNullAndEmptyArrays: true } },
		{
			$lookup: {
				from: "volumes",
				localField: "ownedVolumes",
				foreignField: "_id",
				as: "details",
			},
		},
		{ $unwind: { path: "$details", preserveNullAndEmptyArrays: true } },
		{
			$lookup: {
				from: "series",
				localField: "details.serie",
				foreignField: "_id",
				as: "seriesDetails",
			},
		},
		{ $unwind: { path: "$seriesDetails", preserveNullAndEmptyArrays: true } },
		{ $unwind: { path: `$seriesDetails.${groupField}`, preserveNullAndEmptyArrays: true } },
		{
			$group: { _id: `$seriesDetails.${groupField}`, count: { $sum: 1 } },
		},
		{
			$project: { _id: 0, name: "$_id", count: 1 },
		},
		{ $sort: { count: -1, name: 1 } },
	];
	
	
	const getSeriesStats = (groupField) => [
		{ $match: { username: targetUser } },
		{ $unwind: { path: "$userList", preserveNullAndEmptyArrays: true } },
		{
			$lookup: {
				from: "series",
				localField: "userList.Series",
				foreignField: "_id",
				as: "details",
			},
		},
		{ $unwind: { path: "$details", preserveNullAndEmptyArrays: true } },
		{ $unwind: { path: `$details.${groupField}`, preserveNullAndEmptyArrays: true } },
		{
			$group: { _id: `$details.${groupField}`, count: { $sum: 1 } },
		},
		{
			$project: { _id: 0, name: "$_id", count: 1 },
		},
		{ $sort: { count: -1, name: 1 } },
	];
	
	// Pipelines
	const genresByVolumePipeline = getVolumesStats("genres");
	const publisherByVolumePipeline = getVolumesStats("publisher");
	const genresBySeriesPipeline = getSeriesStats("genres");
	const publisherBySeriesPipeline = getSeriesStats("publisher");
	
	
	const countPipeline = [
		{ $match: { username: targetUser } },
		{
			$project: {
				ownedVolumesCount: { $size: "$ownedVolumes" },
				userListCount: { $size: "$userList" },
			},
		},
	];

	// Execute queries
	const [genresByVolume, genresBySeries, publisherByVolume, publisherBySeries, counts] =
		await Promise.all([
			User.aggregate(genresByVolumePipeline).exec(),
			User.aggregate(genresBySeriesPipeline).exec(),
			User.aggregate(publisherByVolumePipeline).exec(),
			User.aggregate(publisherBySeriesPipeline).exec(),
			User.aggregate(countPipeline).exec(),
		]);

	// Build response
	const stats = {
		genresBySeries,
		genresByVolume,
		publisherByVolume,
		publisherBySeries,
		volumesCount: counts[0]?.ownedVolumesCount || 0,
		seriesCount: counts[0]?.userListCount || 0,
	};

	res.send(stats);
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

exports.getSocials = asyncHandler(async (req, res, next) => {
	const { username, type } = req.params; 

	if (!["following", "followers"].includes(type)) {
		return res.status(400).json({ msg: "Requisição inválida" });
	}

	const user = await User.findOne({ username })
		.select(type)
		.populate(type, "_id username profileImageUrl profileBannerUrl")
		.lean();

	if (!user) {
		return res.status(404).json({ msg: "Usuário não encontrado" });
	}

	res.json(user[type]);
});

exports.setUserNotifications = asyncHandler(async (req, res, next) => {

	if (!req.isAuthenticated()) {
		return res.status(401).json({ msg: "Usuário deve estar logado" });
	}
	const user = await User.findById(req.user._id);

	user.settings.notifications = {
		allow: req.body.enable === "on",
		volumes: req.body.volumes === "on",
		followers: req.body.followers === "on",
		updates: req.body.updates === "on",
		email: req.body["email-notification"] === "on",
		site: req.body["site-notification"] === "on",
	};

	user.save();
	res.send({ msg: "Atualizado com sucesso" });
});

exports.changePassword = asyncHandler(async (req, res, next) => {
	const { password } = req.body;
	const hashedPassword = await bcrypt.hash(password, 10);
	await User.findByIdAndUpdate(req.user._id, {
		password: hashedPassword,
	});
	res.status(201).json({ msg: "Senha atualizada com sucesso" });
});
exports.changeEmail = asyncHandler(async (req, res, next) => {
	const { email } = req.body;
	const user = await User.findOne({ email });
	if (user) {
		return res.status(409).json({ msg: "Email já está em uso" });
	}
	await User.findByIdAndUpdate(req.user._id, {
		email,
	});
	res.status(201).json({ msg: "Email atualizado com sucesso" });
});

exports.allowAdultContent = asyncHandler(async (req, res, next) => {

	if (!req.body.allow) {
		await User.findByIdAndUpdate(req.user._id, {
			allowAdult: false,
		});
	}
	await User.findByIdAndUpdate(req.user._id, {
		allowAdult: req.body.allow,
		allowedAdultAt: new Date(),
	});
	res.status(201).json({ msg: "Atualizado com sucesso" });
});
