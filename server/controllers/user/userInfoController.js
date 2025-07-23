const User = require("../../models/User");
const asyncHandler = require("express-async-handler");
const {
	getVolumeCoverURL,
	getSeriesCoverURL,
} = require("../../Utils/getCoverFunctions");

const ITEMS_PER_PAGE = 36;
//Filters for building search pipeline

const buildFilter = ({ publisher, genre, search }, field) => {
	const filter = {};
	if (genre) filter[`${field}.genres`] = { $in: [genre] };
	if (publisher) filter[`${field}.publisher`] = publisher;
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

const buildAggregationPipeline = (
	targetUser,
	allowAdult,
	filter,
	sortStage,
	skip
) => {
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

	// Apply adult content filtering if necessary
	if (!allowAdult) {
		pipeline.splice(6, 0, { $match: { "userList.Series.isAdult": false } });
	}

	return pipeline;
};

const buildWishlistPipeline = (
	targetUser,
	allowAdult,
	filter,
	sortStage,
	skip
) => {
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

	// Apply adult content filtering if necessary
	if (!allowAdult) {
		pipeline.splice(6, 0, { $match: { "wishListSeries.isAdult": false } });
	}
	return pipeline;
};
exports.getUserCollection = asyncHandler(async (req, res, next) => {
	const targetUser = req.params.username?.trim();
	if (!targetUser)
		return res.status(400).send({ msg: "Usuário não encontrado" });

	const page = parseInt(req.query.p) || 1;
	const skip = ITEMS_PER_PAGE * (page - 1);
	const filter = buildFilter(req.query, "userList.Series");
	const sortStage = buildSortStage(
		req.query.ordering || "title",
		"userList.Series"
	);
	const allowAdult = req.user?.allowAdult || false;
	const pipeline = buildAggregationPipeline(
		targetUser,
		allowAdult,
		filter,
		sortStage,
		skip
	);
	const userCollection = await User.aggregate(pipeline);
	const filteredList = userCollection.map((series) => {
		return {
			...series,
			image: getSeriesCoverURL(series),
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
	const allowAdult = req.user?.allowAdult || false;
	const pipeline = buildWishlistPipeline(
		targetUser,
		allowAdult,
		filter,
		sortStage,
		skip
	);
	const userCollection = await User.aggregate(pipeline);
	const filteredList = userCollection.map((series) => {
		return {
			...series,
			image: getSeriesCoverURL(series),
			inUserList: false,
			inWishlist: true
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
				seriesId: { $first: "$seriesDetails._id" },
				seriesSize: { $first: { $size: "$seriesDetails.volumes" } },
				seriesStatus: { $first: "$seriesDetails.status" },
				volumeId: { $first: "$volumeDetails._id" },
				volumeNumber: { $first: "$volumeDetails.number" },
				status: { $first: "$userList.status" },
			},
		},
		{ $match: { status: { $ne: "Dropped" } } },
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
		{
			$unwind: {
				path: "$ownedVolumes",
				preserveNullAndEmptyArrays: true,
			},
		},
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
		{
			$unwind: {
				path: "$seriesDetails",
				preserveNullAndEmptyArrays: true,
			},
		},
		{
			$unwind: {
				path: `$seriesDetails.${groupField}`,
				preserveNullAndEmptyArrays: false,
			},
		},
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
		{
			$unwind: {
				path: `$details.${groupField}`,
				preserveNullAndEmptyArrays: true,
			},
		},
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
			$addFields: {
				originalUserList: "$userList",
			},
		},
		{ $unwind: "$userList" },
		{ $match: { "userList.status": { $ne: "Dropped" } } },
		{
			$group: {
				_id: "$_id",
				nonDroppedSeriesIds: { $push: "$userList.Series" },
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
		//For missing count
		{
			$lookup: {
				from: "series",
				localField: "nonDroppedSeriesIds",
				foreignField: "_id",
				as: "userListSeriesData",
			},
		},
		{
			$project: {
				ownedVolumesCount: { $size: { $ifNull: ["$ownedVolumes", []] } },
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
				missingVolumesCount: {
					$size: {
						$setDifference: [
							{
								$reduce: {
									input: "$userListSeriesData",
									initialValue: [],
									in: { $concatArrays: ["$$value", "$$this.volumes"] },
								},
							},
							{ $ifNull: ["$ownedVolumes", []] },
						],
					},
				},
			},
		},
	];

	// Execute queries
	const [
		genresByVolume,
		genresBySeries,
		publisherByVolume,
		publisherBySeries,
		counts,
	] = await Promise.all([
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
		wishListSeriesCount: counts[0]?.wishListSeriesCount || 0,
		wishListVolumesCount: counts[0]?.wishListVolumesCount || 0,
		missingVolumesCount: counts[0]?.missingVolumesCount || 0,
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
