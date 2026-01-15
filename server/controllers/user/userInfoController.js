const User = require("../../models/User");
const asyncHandler = require("express-async-handler");
const {
	getVolumeCoverURL,
	getSeriesCoverURL,
} = require("../../Utils/getCoverFunctions");
const logger = require("../../Utils/logger");

const ITEMS_PER_PAGE = 36;
//Filters for building search pipeline

const buildFilter = ({ publisher, genre, status, search }, field) => {
	const filter = {};
	if (genre) filter[`${field}.genres`] = { $in: [genre] };
	if (publisher) filter[`${field}.publisher`] = publisher;
	if (status) filter[`${field}.status`] = status;
	if (search) {
		const searchRegex = { $regex: search, $options: "i" };
		const titleField = `${field}.title`;
		const synonymsField = `${field}.synonyms`;
		const authorsField = `${field}.authors`;
		filter.$or = [
			{ [titleField]: searchRegex },
			{ [synonymsField]: searchRegex },
			{ [authorsField]: searchRegex },
		];
	}
	return filter;
};

const buildSortStage = (ordering, field) => {
	const sortOptions = {
		// Order 1 for ascending and 2 for descending
		popularity: { atribute: `${field}.popularity`, order: -1 },
		title: { atribute: `${field}.title`, order: 1 },
		publisher: { atribute: `${field}.publisher`, order: 1 },
		dateJp: { atribute: `${field}.originalRun.dates.publishedAt`, order: -1 },
		dateBr: { atribute: `${field}.dates.publishedAt`, order: -1 },
		volumes: { atribute: "volumesLength", order: -1 },
		timestamp: { atribute: "userList.timestamp", order: 1 },
		status: { atribute: "userList.completionPercentage", order: 1 },
	};

	const sortStage = {
		[sortOptions[ordering].atribute]: sortOptions[ordering].order,
		"userList.Series.title": 1,
	};
	return sortStage;
};

const buildVolumeSortStage = (ordering) => {
	const sortOptions = {
		popularity: { attribute: "seriesInfo.popularity", order: -1 },
		title: { attribute: "seriesInfo.title", order: 1 },
		publisher: { attribute: "seriesInfo.publisher", order: 1 },
		dateJp: { attribute: `seriesInfo.originalRun.dates.publishedAt`, order: -1 },
		dateBr: { attribute: `seriesInfo.dates.publishedAt`, order: -1 },
		number: { attribute: "volumeInfo.number", order: 1 },
		timestamp: { attribute: "ownedVolumes.acquiredAt", order: -1 },
		status: { attribute: "ownedVolumes.isRead", order: 1 },
	};

	const selectedOption = sortOptions[ordering] || sortOptions.timestamp;

	const sortStage = {
		[selectedOption.attribute]: selectedOption.order,
		"seriesInfo.title": 1,
		"volumeInfo.number": 1,
	};

	return sortStage;
};
const buildAggregationPipeline = (targetUser, filter, sortStage, skip) => {
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
				status: "$userList.status",
			},
		},
		{ $skip: skip },
		{ $limit: ITEMS_PER_PAGE },
	];

	return pipeline;
};

const buildVolumeAggregationPipeline = (
	targetUser,
	filter,
	sortStage,
	skip
) => {
	const pipeline = [
		{ $match: { username: targetUser } },

		{
			$project: {
				ownedVolumes: {
					$filter: {
						input: "$ownedVolumes",
						as: "item",
						cond: { $ne: ["$$item.volume", null] },
					},
				},
			},
		},

		{ $unwind: "$ownedVolumes" },

		{
			$lookup: {
				from: "volumes",
				localField: "ownedVolumes.volume",
				foreignField: "_id",
				as: "volumeInfo",
			},
		},
		{ $unwind: "$volumeInfo" },

		{
			$lookup: {
				from: "series",
				localField: "volumeInfo.serie",
				foreignField: "_id",
				as: "seriesInfo",
			},
		},
		{ $unwind: "$seriesInfo" },

		{ $match: filter },

		{ $sort: sortStage },

		{
			$project: {
				_id: "$volumeInfo._id",
				title: "$seriesInfo.title",
				volumeNumber: "$volumeInfo.number",
				isVariant: "$volumeInfo.isVariant",
				variantNumber: "$volumeInfo.variantNumber",
				isAdult: "$seriesInfo.isAdult",
				acquiredAt: "$ownedVolumes.acquiredAt",
				isRead: "$ownedVolumes.isRead",
				readAt: "$ownedVolumes.readAt",
				readCount: "$ownedVolumes.readCount",
				amount: "$ownedVolumes.amount",
				purchasePrice: "$ownedVolumes.purchasePrice",
				notes: "$ownedVolumes.notes",
				seriesId: "$seriesInfo._id",
			},
		},

		{ $skip: skip },
		{ $limit: ITEMS_PER_PAGE },
	];

	return pipeline;
};

const buildWishlistPipeline = (targetUser, filter, sortStage, skip) => {
	const pipeline = [
		{ $match: { username: targetUser } },
		{ $unwind: "$wishList" },

		{
			$lookup: {
				from: "series",
				localField: "wishList",
				foreignField: "_id",
				as: "wishListSeries",
			},
		},
		{ $unwind: "$wishListSeries" },
		{
			$addFields: {
				volumesLength: { $size: "$wishListSeries.volumes" },
			},
		},
		{ $match: filter },
		{ $sort: sortStage },
		{
			$project: {
				_id: "$wishListSeries._id",
				title: "$wishListSeries.title",
				isAdult: "$wishListSeries.isAdult",
			},
		},
		{ $skip: skip },
		{ $limit: ITEMS_PER_PAGE },
	];

	return pipeline;
};
exports.getUserCollection = asyncHandler(async (req, res, next) => {
	const targetUser = req.params.username?.trim();
	if (!targetUser)
		return res.status(400).send({ msg: "Usuário não encontrado" });

	const page = parseInt(req.query.p) || 1;
	const skip = ITEMS_PER_PAGE * (page - 1);
	const filter = buildFilter(req.query, "userList.Series");
	if (req.query.group) {
		filter["userList.status"] = req.query.group;
	}
	const sortStage = buildSortStage(
		req.query.ordering || "title",
		"userList.Series"
	);
	const pipeline = buildAggregationPipeline(
		targetUser,
		filter,
		sortStage,
		skip
	);
	const userCollection = await User.aggregate(pipeline);
	const filteredList = userCollection.map((series) => {
		let image = getSeriesCoverURL(series);

		if (series.isAdult && !req.user?.allowAdult) {
			image = null;
		}
		return {
			...series,
			image: image,
		};
	});

	res.send(filteredList);
});

exports.getUserWishlist = asyncHandler(async (req, res, next) => {
	const targetUser = req.params.username?.trim();
	if (!targetUser)
		return res.status(400).send({ msg: "Usuário não encontrado" });

	const page = parseInt(req.query.p) || 1;
	const skip = ITEMS_PER_PAGE * (page - 1);
	const filter = buildFilter(req.query, "wishListSeries");
	const sortStage = buildSortStage(
		req.query.ordering || "title",
		"wishListSeries"
	);
	const pipeline = buildWishlistPipeline(targetUser, filter, sortStage, skip);
	const userCollection = await User.aggregate(pipeline);
	const filteredList = userCollection.map((series) => {
		let image = getSeriesCoverURL(series);

		if (series.isAdult && !req.user?.allowAdult) {
			image = null;
		}
		return {
			...series,
			image: image,
			inUserList: false,
			inWishlist: true,
		};
	});

	res.send(filteredList);
});

exports.getMissingPage = asyncHandler(async (req, res, next) => {
	const targetUser = req.params.username?.trim();
	if (!targetUser)
		return res.status(400).send({ msg: "Usuário não encontrado" });

	const page = parseInt(req.query.p) || 1;
	const skip = ITEMS_PER_PAGE * (page - 1);

	const aggregationPipeline = [
		{ $match: { username: targetUser } },

		{
			$addFields: {
				ownedVolumeIds: {
					$map: {
						input: { $ifNull: ["$ownedVolumes", []] },
						as: "ov",
						in: "$$ov.volume",
					},
				},
			},
		},
		{ $project: { ownedVolumes: 0 } },

		{ $unwind: "$userList" },
		{ $match: { "userList.status": { $ne: "Dropped" } } },

		{
			$lookup: {
				from: "series",
				localField: "userList.Series",
				foreignField: "_id",
				as: "seriesDetails",
			},
		},
		{ $unwind: "$seriesDetails" },
		{
			$lookup: {
				from: "volumes",
				localField: "seriesDetails.volumes",
				foreignField: "_id",
				as: "volumeDetails",
			},
		},
		{ $unwind: "$volumeDetails" },

		{
			$project: {
				"seriesDetails.title": 1,
				"seriesDetails._id": 1,
				"seriesDetails.volumes": 1,
				"seriesDetails.status": 1,
				"volumeDetails._id": 1,
				"volumeDetails.number": 1,
				"volumeDetails.isVariant": 1,
				"userList.status": 1,

				isOwned: {
					$in: ["$volumeDetails._id", { $ifNull: ["$ownedVolumeIds", []] }],
				},
				variantSort: {
					$cond: [{ $ifNull: ["$volumeDetails.isVariant", false] }, 1, 0],
				},
			},
		},

		{
			$sort: {
				"seriesDetails.title": 1,
				"volumeDetails.number": 1,
				variantSort: 1,
			},
		},

		{
			$group: {
				_id: {
					seriesId: "$seriesDetails._id",
					volNumber: "$volumeDetails.number",
				},
				hasOwnedVariant: { $max: "$isOwned" },

				series: { $first: "$seriesDetails.title" },
				seriesId: { $first: "$seriesDetails._id" },
				seriesSize: { $first: { $size: "$seriesDetails.volumes" } },
				seriesStatus: { $first: "$seriesDetails.status" },
				displayVolumeId: { $first: "$volumeDetails._id" },
				displayVolumeNumber: { $first: "$volumeDetails.number" },
				userStatus: { $first: "$userList.status" },
			},
		},

		{ $match: { hasOwnedVariant: false } },

		{
			$project: {
				_id: "$displayVolumeId",
				series: 1,
				seriesId: 1,
				seriesSize: 1,
				seriesStatus: 1,
				volumeId: "$displayVolumeId",
				volumeNumber: "$displayVolumeNumber",
				status: "$userStatus",
			},
		},

		{
			$sort: {
				series: 1,
				volumeNumber: 1,
			},
		},
		{ $skip: skip },
		{ $limit: ITEMS_PER_PAGE },
	];
	const missingVolumesList = await User.aggregate(aggregationPipeline)
		.allowDiskUse(true)
		.exec();
	const listWithImages = missingVolumesList.map((volume) => {
		const seriesObject = { title: volume.series };
		let image = getVolumeCoverURL(seriesObject, volume.volumeNumber);

		if (volume.isAdult && !req.user?.allowAdult) {
			image = null;
		}
		const { series, volumeId, seriesStatus, ...rest } = volume;
		return {
			...rest,
			title: volume.series,
			image: image,
		};
	});
	res.send(listWithImages);
});
exports.getUserInfo = asyncHandler(async (req, res, next) => {
	const targetUser = req.params.username;
	if (!targetUser) return res.send({ msg: "Nenhum usuário informado" });

	const user = await User.findOne(
		{ username: targetUser },
		{ profileImageUrl: 1, username: 1, profileBannerUrl: 1 }
	).lean();
	if (!user) return res.status(404).json({ msg: "Usuário não encontrado" });

	const following = req.user?.following?.includes(user._id) || false;
	const userInfo = { ...user, following };

	return res.send(userInfo);
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
				localField: "ownedVolumes.volume",
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
		{
			$unwind: {
				path: `$seriesDetails.${groupField}`,
				preserveNullAndEmptyArrays: false,
			},
		},
		{
			$group: {
				_id: `$seriesDetails.${groupField}`,
				count: { $sum: "$ownedVolumes.amount" },
			},
		},
		{ $project: { _id: 0, name: "$_id", count: 1 } },
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
		{ $unwind: { path: "$details", preserveNullAndEmptyArrays: false } },
		{
			$unwind: {
				path: `$details.${groupField}`,
				preserveNullAndEmptyArrays: true,
			},
		},
		{ $group: { _id: `$details.${groupField}`, count: { $sum: 1 } } },
		{ $project: { _id: 0, name: "$_id", count: 1 } },
		{ $sort: { count: -1, name: 1 } },
	];

	const missingCountPipeline = [
		{ $match: { username: targetUser } },
		{
			$addFields: {
				ownedVolumeIds: {
					$map: {
						input: { $ifNull: ["$ownedVolumes", []] },
						as: "ov",
						in: "$$ov.volume",
					},
				},
			},
		},
		{ $project: { ownedVolumes: 0 } },
		{ $unwind: "$userList" },
		{ $match: { "userList.status": { $ne: "Dropped" } } },
		{
			$lookup: {
				from: "series",
				localField: "userList.Series",
				foreignField: "_id",
				as: "seriesDetails",
			},
		},
		{ $unwind: "$seriesDetails" },
		{
			$lookup: {
				from: "volumes",
				localField: "seriesDetails.volumes",
				foreignField: "_id",
				as: "volumeDetails",
			},
		},
		{ $unwind: "$volumeDetails" },
		{
			$project: {
				seriesId: "$seriesDetails._id",
				volNumber: "$volumeDetails.number",
				isOwned: {
					$in: ["$volumeDetails._id", { $ifNull: ["$ownedVolumeIds", []] }],
				},
			},
		},
		{
			$group: {
				_id: { seriesId: "$seriesId", volNumber: "$volNumber" },
				hasOwnedVariant: { $max: "$isOwned" },
			},
		},
		{ $match: { hasOwnedVariant: false } },
		{ $count: "totalMissing" },
	];

	const generalCountsPipeline = [
		{ $match: { username: targetUser } },
		{
			$addFields: {
				originalUserList: "$userList",
			},
		},
		{ $unwind: "$userList" },
		{ $match: { "userList.status": { $ne: "Dropped" } } },
		{
			$group: {
				_id: "$_id",
				ownedVolumes: { $first: "$ownedVolumes" },
				wishList: { $first: "$wishList" },
				originalUserList: { $first: "$originalUserList" },
			},
		},
		{
			$lookup: {
				from: "series",
				localField: "wishList",
				foreignField: "_id",
				as: "wishListSeries",
			},
		},
		{
			$project: {
				ownedVolumesCount: { $sum: "$ownedVolumes.amount" },
				userListCount: { $size: { $ifNull: ["$originalUserList", []] } },
				wishListSeriesCount: { $size: { $ifNull: ["$wishList", []] } },
				wishListVolumesCount: {
					$sum: {
						$map: {
							input: "$wishListSeries",
							as: "series",
							in: { $size: { $ifNull: ["$$series.volumes", []] } },
						},
					},
				},
			},
		},
	];

	const [
		genresByVolume,
		genresBySeries,
		publisherByVolume,
		publisherBySeries,
		generalCounts,
		missingCountResult,
	] = await Promise.all([
		User.aggregate(getVolumesStats("genres")).exec(),
		User.aggregate(getSeriesStats("genres")).exec(),
		User.aggregate(getVolumesStats("publisher")).exec(),
		User.aggregate(getSeriesStats("publisher")).exec(),
		User.aggregate(generalCountsPipeline).exec(),
		User.aggregate(missingCountPipeline).exec(),
	]);

	const stats = {
		genresBySeries,
		genresByVolume,
		publisherByVolume,
		publisherBySeries,
		volumesCount: generalCounts[0]?.ownedVolumesCount || 0,
		seriesCount: generalCounts[0]?.userListCount || 0,
		wishListSeriesCount: generalCounts[0]?.wishListSeriesCount || 0,
		wishListVolumesCount: generalCounts[0]?.wishListVolumesCount || 0,
		missingVolumesCount: missingCountResult[0]?.totalMissing || 0,
	};

	res.send(stats);
});
exports.getSocials = asyncHandler(async (req, res, next) => {
	const { username, type } = req.params;

	if (!["following", "followers"].includes(type)) {
		return res.status(400).json({ msg: "Requisição inválida" });
	}
	const page = parseInt(req.query.p) || 1;
	const skip = ITEMS_PER_PAGE * (page - 1);

	const users = await User.aggregate([
		{ $match: { username } },
		{ $unwind: `$${type}` },
		{
			$lookup: {
				from: "users",
				localField: type,
				foreignField: "_id",
				as: `${type}Details`,
			},
		},
		{ $unwind: `$${type}Details` },
		{
			$addFields: {
				followersCount: {
					$size: { $ifNull: [`$${type}Details.followers`, []] },
				},
			},
		},
		{ $sort: { followersCount: -1, username: 1 } },
		{
			$project: {
				_id: `$${type}Details._id`,
				username: `$${type}Details.username`,
				profileImageUrl: `$${type}Details.profileImageUrl`,
				profileBannerUrl: `$${type}Details.profileBannerUrl`,
			},
		},
		{ $skip: skip },
		{ $limit: ITEMS_PER_PAGE },
	]);

	res.json(users);
});

exports.searchUser = asyncHandler(async (req, res, next) => {
	const regex = new RegExp(req.query.q, "i");
	const page = parseInt(req.query.p) || 1;
	const users_per_page = 12;
	const skip = users_per_page * (page - 1);
	const users = await User.aggregate([
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

	return res.send(users);
});

exports.getUserFilters = asyncHandler(async (req, res, next) => {
	const targetUser = req.params.username;
	if (!targetUser) return res.send({ msg: "Nenhum usuário informado" });

	const source = req.query.source || "userList";

	let seriesSourceProjection;
	if (source === "userList") {
		seriesSourceProjection = {
			allSeries: {
				$map: { input: "$userList", as: "item", in: "$$item.Series" },
			},
		};
	} else if (source === "wishList") {
		seriesSourceProjection = {
			allSeries: "$wishList",
		};
	} else {
		seriesSourceProjection = {
			allSeries: {
				$concatArrays: [
					{ $map: { input: "$userList", as: "item", in: "$$item.Series" } },
					"$wishList",
				],
			},
		};
	}

	const result = await User.aggregate([
		{ $match: { username: targetUser } },
		{ $project: seriesSourceProjection },
		{ $unwind: "$allSeries" },
		{
			$lookup: {
				from: "series",
				localField: "allSeries",
				foreignField: "_id",
				as: "series",
			},
		},
		{ $unwind: "$series" },
		{
			$facet: {
				genres: [
					{ $unwind: "$series.genres" },
					{ $match: { "series.genres": { $ne: null, $nin: [""] } } },
					{
						$group: {
							_id: null,
							genres: { $addToSet: "$series.genres" },
						},
					},
				],
				publishers: [
					{ $match: { "series.publisher": { $ne: null, $nin: [""] } } },
					{
						$group: {
							_id: null,
							publishers: { $addToSet: "$series.publisher" },
						},
					},
				],
			},
		},
		{
			$project: {
				genres: {
					$cond: [
						{ $gt: [{ $size: "$genres" }, 0] },
						{
							$sortArray: {
								input: { $arrayElemAt: ["$genres.genres", 0] },
								sortBy: 1,
							},
						},
						[],
					],
				},
				publishers: {
					$cond: [
						{ $gt: [{ $size: "$publishers" }, 0] },
						{
							$sortArray: {
								input: { $arrayElemAt: ["$publishers.publishers", 0] },
								sortBy: 1,
							},
						},
						[],
					],
				},
			},
		},
	]);

	return res.send(result[0] || { genres: [], publishers: [] });
});

exports.getUserReadList = asyncHandler(async (req, res, next) => {
	const targetUser = req.params.username?.trim();
	if (!targetUser)
		return res.status(400).send({ msg: "Usuário não encontrado" });

	const page = parseInt(req.query.p) || 1;
	const skip = ITEMS_PER_PAGE * (page - 1);
	const filter = buildFilter(req.query, "seriesInfo");

	if (req.query.group) {
		const bool = req.query.group === "true" ? true : false;
		filter["ownedVolumes.isRead"] = bool;
	}
	const sortStage = buildVolumeSortStage(req.query.ordering || "title");
	const pipeline = buildVolumeAggregationPipeline(
		targetUser,
		filter,
		sortStage,
		skip
	);
	const userCollection = await User.aggregate(pipeline);
	const filteredList = userCollection.map((volume) => {
		const seriesObject = {
			title: volume.title,
		};
		let image = getVolumeCoverURL(
			seriesObject,
			volume.volumeNumber,
			volume.isVariant,
			volume.variantNumber
		);
		if (volume.isAdult && !req.user?.allowAdult) {
			image = null;
		}
		return {
			...volume,
			image: image,
		};
	});
	res.send(filteredList);
});
