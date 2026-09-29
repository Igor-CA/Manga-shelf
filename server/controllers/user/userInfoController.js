const User = require("../../models/User");
const Rating = require("../../models/Rating");
const asyncHandler = require("express-async-handler");
const {
	getVolumeCoverURL,
	getSeriesCoverURL,
} = require("../../Utils/getCoverFunctions");
const logger = require("../../Utils/logger");
const { escapeRegex } = require("../../Utils/escapeRegex");
const {
	getActiveProviders,
	getStoredLinks,
	buildDerivedLinks,
	primaryStoreUrl,
} = require("../../Utils/linkProviders");

const ITEMS_PER_PAGE = 36;

const buildSeriesMyRatingLookupStages = (ownerId, seriesIdExpr) => [
	{
		$lookup: {
			from: "ratings",
			let: { seriesId: seriesIdExpr },
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [
								{ $eq: ["$user", ownerId] },
								{ $eq: ["$series", "$$seriesId"] },
							],
						},
					},
				},
				{
					$group: {
						_id: null,
						manual: {
							$max: {
								$cond: [{ $eq: ["$volume", null] }, "$score", null],
							},
						},
						volumeScores: {
							$push: {
								$cond: [{ $ne: ["$volume", null] }, "$score", "$$REMOVE"],
							},
						},
					},
				},
				{
					$project: {
						_id: 0,
						effectiveScore: {
							$cond: [
								{ $ne: ["$manual", null] },
								"$manual",
								{
									$cond: [
										{ $gt: [{ $size: "$volumeScores" }, 0] },
										{ $avg: "$volumeScores" },
										null,
									],
								},
							],
						},
					},
				},
			],
			as: "_myRatingLookup",
		},
	},
	{
		$addFields: {
			myRatingScore: { $arrayElemAt: ["$_myRatingLookup.effectiveScore", 0] },
			hasMyRating: {
				$ne: [{ $arrayElemAt: ["$_myRatingLookup.effectiveScore", 0] }, null],
			},
		},
	},
];

const buildVolumeMyRatingLookupStages = (ownerId, volumeIdExpr) => [
	{
		$lookup: {
			from: "ratings",
			let: { volumeId: volumeIdExpr },
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [
								{ $eq: ["$user", ownerId] },
								{ $eq: ["$volume", "$$volumeId"] },
							],
						},
					},
				},
				{ $project: { _id: 0, score: 1 } },
			],
			as: "_myRatingLookup",
		},
	},
	{
		$addFields: {
			myRatingScore: { $arrayElemAt: ["$_myRatingLookup.score", 0] },
			hasMyRating: {
				$ne: [{ $arrayElemAt: ["$_myRatingLookup.score", 0] }, null],
			},
		},
	},
];

//Filters for building search pipeline

const buildFilter = (
	{ publisher, genre, status, search, demographic, type },
	field
) => {
	const filter = {};
	if (genre) filter[`${field}.genres`] = { $in: [genre] };
	if (publisher) filter[`${field}.publisher`] = publisher;
	if (status) filter[`${field}.status`] = status;
	if (demographic) filter[`${field}.demographic`] = demographic;
	if (type) filter[`${field}.type`] = type;
	if (search) {
		const searchRegex = { $regex: escapeRegex(search), $options: "i" };
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
		popularity: { attribute: `${field}.popularity`, order: -1 },
		title: { attribute: `${field}.title`, order: 1 },
		publisher: { attribute: `${field}.publisher`, order: 1 },
		dateJp: { attribute: `${field}.originalRun.dates.publishedAt`, order: -1 },
		dateBr: { attribute: `${field}.dates.publishedAt`, order: -1 },
		volumes: { attribute: "volumesLength", order: -1 },
		rating: { attribute: `${field}.ratingAverage`, order: -1 },
		myRating: { attribute: "myRatingScore", order: -1 },
		timestamp: { attribute: "userList.timestamp", order: 1 },
		status: { attribute: "userList.completionPercentage", order: 1 },
	};

	if (ordering === "myRating") {
		return { hasMyRating: -1, myRatingScore: -1, [`${field}.title`]: 1 };
	}

	const selectedOption = sortOptions[ordering] || sortOptions.timestamp;

	const sortStage = {
		[selectedOption.attribute]: selectedOption.order,
		"userList.Series.title": 1,
	};
	return sortStage;
};

const buildVolumeSortStage = (ordering) => {
	const sortOptions = {
		popularity: { attribute: "seriesInfo.popularity", order: -1 },
		title: { attribute: "seriesInfo.title", order: 1 },
		publisher: { attribute: "seriesInfo.publisher", order: 1 },
		dateJp: {
			attribute: `seriesInfo.originalRun.dates.publishedAt`,
			order: -1,
		},
		dateBr: { attribute: `seriesInfo.dates.publishedAt`, order: -1 },
		number: { attribute: "volumeInfo.number", order: 1 },
		rating: { attribute: "volumeInfo.ratingAverage", order: -1 },
		myRating: { attribute: "myRatingScore", order: -1 },
		timestamp: { attribute: "ownedVolumes.acquiredAt", order: -1 },
		status: { attribute: "ownedVolumes.isRead", order: 1 },
		volumes: { attribute: "volumesLength", order: -1 },
	};

	if (ordering === "myRating") {
		return {
			hasMyRating: -1,
			myRatingScore: -1,
			"seriesInfo.title": 1,
			"volumeInfo.number": 1,
		};
	}

	const selectedOption = sortOptions[ordering] || sortOptions.timestamp;

	const sortStage = {
		[selectedOption.attribute]: selectedOption.order,
		"seriesInfo.title": 1,
		"volumeInfo.number": 1,
	};

	return sortStage;
};
const buildAggregationPipeline = (
	targetUser,
	filter,
	sortStage,
	skip,
	myRatingStages = [],
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
		...myRatingStages,
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
	skip,
	myRatingStages = [],
	isOwner = false,
	{ pageSize = ITEMS_PER_PAGE, includeLotSize = false, withTotal = false } = {},
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

		{ $addFields: { volumesLength: { $size: "$seriesInfo.volumes" } } },

		{ $match: filter },

		...myRatingStages,

		{ $sort: sortStage },

		{
			$project: {
				_id: "$volumeInfo._id",
				title: "$seriesInfo.title",
				volumeNumber: "$volumeInfo.number",
				isVariant: "$volumeInfo.isVariant",
				variantNumber: "$volumeInfo.variantNumber",
				isAdult: "$seriesInfo.isAdult",
				isRead: "$ownedVolumes.isRead",
				readAt: "$ownedVolumes.readAt",
				readCount: "$ownedVolumes.readCount",
				amount: "$ownedVolumes.amount",
				seriesId: "$seriesInfo._id",
				...(isOwner
					? {
							acquiredAt: "$ownedVolumes.acquiredAt",
							purchasePrice: "$ownedVolumes.purchasePrice",
							notes: "$ownedVolumes.notes",
							store: "$ownedVolumes.store",
							condition: "$ownedVolumes.condition",
							...(includeLotSize
								? { lotSize: "$ownedVolumes.lotSize" }
								: {}),
						}
					: {}),
			},
		},
	];

	if (withTotal) {
		pipeline.push({
			$facet: {
				items: [{ $skip: skip }, { $limit: pageSize }],
				totalCount: [{ $count: "count" }],
			},
		});
	} else {
		pipeline.push({ $skip: skip }, { $limit: pageSize });
	}

	return pipeline;
};

const buildWishlistPipeline = (
	targetUser,
	filter,
	sortStage,
	skip,
	myRatingStages = [],
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
		...myRatingStages,
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
	const ordering = req.query.ordering || "title";
	const sortStage = buildSortStage(ordering, "userList.Series");

	const owner = await User.findOne({ username: targetUser }).select("_id");
	const myRatingStages =
		ordering === "myRating" && owner
			? buildSeriesMyRatingLookupStages(owner._id, "$userList.Series._id")
			: [];

	const pipeline = buildAggregationPipeline(
		targetUser,
		filter,
		sortStage,
		skip,
		myRatingStages,
	);
	const userCollection = await User.aggregate(pipeline);

	const pageSeriesIds = userCollection.map((series) => series._id);
	const ratingsBySeriesId = new Map();
	if (pageSeriesIds.length && owner) {
		const ratings = await Rating.find({
			user: owner._id,
			series: { $in: pageSeriesIds },
		}).select("series volume score");
		for (const rating of ratings) {
			const key = rating.series.toString();
			if (!ratingsBySeriesId.has(key)) ratingsBySeriesId.set(key, []);
			ratingsBySeriesId.get(key).push(rating);
		}
	}

	const filteredList = userCollection.map((series) => {
		let image = getSeriesCoverURL(series);

		if (series.isAdult && !req.user?.allowAdult) {
			image = null;
		}

		const seriesRatings = ratingsBySeriesId.get(series._id.toString());
		let ratingScore = null;
		let isDerived = false;
		if (seriesRatings?.length) {
			const manual = seriesRatings.find((rating) => rating.volume == null);
			if (manual) {
				ratingScore = Math.round(manual.score);
			} else {
				const volumeScores = seriesRatings
					.filter((rating) => rating.volume != null)
					.map((rating) => rating.score);
				if (volumeScores.length) {
					const mean =
						volumeScores.reduce((sum, score) => sum + score, 0) /
						volumeScores.length;
					ratingScore = Math.round(mean);
					isDerived = true;
				}
			}
		}

		return {
			...series,
			image: image,
			ratingScore,
			isDerived,
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
	const ordering = req.query.ordering || "title";
	const sortStage = buildSortStage(ordering, "wishListSeries");

	let myRatingStages = [];
	if (ordering === "myRating") {
		const owner = await User.findOne({ username: targetUser }).select("_id");
		if (owner) {
			myRatingStages = buildSeriesMyRatingLookupStages(
				owner._id,
				"$wishListSeries._id",
			);
		}
	}

	const pipeline = buildWishlistPipeline(
		targetUser,
		filter,
		sortStage,
		skip,
		myRatingStages,
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
	const shiftOffset = parseInt(req.query.offset) || 0;
	const calculatedSkip = ITEMS_PER_PAGE * (page - 1) - shiftOffset;
	const skip = Math.max(0, calculatedSkip);

	const isOwner = req.user?.username === targetUser;

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
				"seriesDetails.isAdult": 1,
				"volumeDetails._id": 1,
				"volumeDetails.number": 1,
				"volumeDetails.isVariant": 1,
				"volumeDetails.ISBN": 1,
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
				isAdult: { $first: "$seriesDetails.isAdult" },
				displayVolumeId: { $first: "$volumeDetails._id" },
				displayVolumeNumber: { $first: "$volumeDetails.number" },
				displayVolumeISBN: { $first: "$volumeDetails.ISBN" },
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
				isAdult: 1,
				volumeId: "$displayVolumeId",
				volumeNumber: "$displayVolumeNumber",
				isbn: "$displayVolumeISBN",
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
	const activeProviders = isOwner ? await getActiveProviders() : [];
	const storedLinks = isOwner
		? await getStoredLinks(
				"Volume",
				missingVolumesList.map((volume) => volume.volumeId),
			)
		: new Map();

	const listWithImages = missingVolumesList.map((volume) => {
		const seriesObject = { title: volume.series };
		let image = getVolumeCoverURL(seriesObject, volume.volumeNumber);

		if (volume.isAdult && !req.user?.allowAdult) {
			image = null;
		}
		const buyUrl = primaryStoreUrl(
			buildDerivedLinks(
				"Volume",
				{ _id: volume.volumeId, ISBN: volume.isbn },
				activeProviders,
				storedLinks,
				{ isAdult: volume.isAdult },
			),
		);
		const { series, volumeId, seriesStatus, isbn, ...rest } = volume;
		return {
			...rest,
			title: volume.series,
			image: image,
			buyUrl,
		};
	});
	res.send(listWithImages);
});
exports.getUserInfo = asyncHandler(async (req, res, next) => {
	const targetUser = req.params.username;
	if (!targetUser)
		return res.status(400).json({ msg: "Nenhum usuário informado" });

	const user = await User.findOne(
		{ username: targetUser },
		{ profileImageUrl: 1, username: 1, profileBannerUrl: 1 },
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

	const isOwner = req.user?.username === targetUser;

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

	const spendingPipeline = [
		{ $match: { username: targetUser } },
		{ $unwind: { path: "$ownedVolumes", preserveNullAndEmptyArrays: true } },
		{
			$match: {
				"ownedVolumes.purchasePrice": { $gte: 0 },
			},
		},
		{
			$lookup: {
				from: "volumes",
				localField: "ownedVolumes.volume",
				foreignField: "_id",
				as: "volumeDetails",
			},
		},
		{ $unwind: "$volumeDetails" },
		{
			$lookup: {
				from: "series",
				localField: "volumeDetails.serie",
				foreignField: "_id",
				as: "seriesDetails",
			},
		},
		{ $unwind: "$seriesDetails" },
		{
			$group: {
				_id: "$seriesDetails._id",
				name: { $first: "$seriesDetails.title" },
				total: {
					$sum: {
						$multiply: [
							"$ownedVolumes.purchasePrice",
							{ $ifNull: ["$ownedVolumes.amount", 1] },
						],
					},
				},
				volumeCount: { $sum: "$ownedVolumes.amount" },
			},
		},
		{ $sort: { total: -1 } },
	];

	const marketValuePipeline = [
		{ $match: { username: targetUser } },
		{ $unwind: "$ownedVolumes" },
		{
			$lookup: {
				from: "volumes",
				localField: "ownedVolumes.volume",
				foreignField: "_id",
				as: "volumeDetails",
			},
		},
		{ $unwind: "$volumeDetails" },
		{
			$addFields: {
				copies: { $ifNull: ["$ownedVolumes.amount", 1] },
				coverPrice: "$volumeDetails.defaultPrice",
			},
		},
		{
			$group: {
				_id: null,
				marketValue: {
					$sum: {
						$multiply: [{ $ifNull: ["$coverPrice", 0] }, "$copies"],
					},
				},
				volumesWithCoverPrice: {
					$sum: { $cond: [{ $gt: ["$coverPrice", 0] }, "$copies", 0] },
				},
				coverValueOfVolumesWithoutPaidPrice: {
					$sum: {
						$cond: [
							{ $isNumber: "$ownedVolumes.purchasePrice" },
							0,
							{ $multiply: [{ $ifNull: ["$coverPrice", 0] }, "$copies"] },
						],
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
		demographicsByVolume,
		demographicsBySeries,
		typeByVolume,
		typeBySeries,
		generalCounts,
		missingCountResult,
		spendingBySeries,
		marketValueResult,
	] = await Promise.all([
		User.aggregate(getVolumesStats("genres")).exec(),
		User.aggregate(getSeriesStats("genres")).exec(),
		User.aggregate(getVolumesStats("publisher")).exec(),
		User.aggregate(getSeriesStats("publisher")).exec(),
		User.aggregate(getVolumesStats("demographic")).exec(),
		User.aggregate(getSeriesStats("demographic")).exec(),
		User.aggregate(getVolumesStats("type")).exec(),
		User.aggregate(getSeriesStats("type")).exec(),
		User.aggregate(generalCountsPipeline).exec(),
		User.aggregate(missingCountPipeline).exec(),
		isOwner ? User.aggregate(spendingPipeline).exec() : Promise.resolve([]),
		User.aggregate(marketValuePipeline).exec(),
	]);

	const totalSpent = spendingBySeries.reduce((sum, s) => sum + s.total, 0);
	const totalTrackedVolumes = spendingBySeries.reduce(
		(sum, s) => sum + s.volumeCount,
		0,
	);

	const stats = {
		genresBySeries,
		genresByVolume,
		publisherByVolume,
		publisherBySeries,
		demographicsByVolume,
		demographicsBySeries,
		typeByVolume,
		typeBySeries,
		volumesCount: generalCounts[0]?.ownedVolumesCount || 0,
		seriesCount: generalCounts[0]?.userListCount || 0,
		wishListSeriesCount: generalCounts[0]?.wishListSeriesCount || 0,
		wishListVolumesCount: generalCounts[0]?.wishListVolumesCount || 0,
		missingVolumesCount: missingCountResult[0]?.totalMissing || 0,
		marketValue: Math.round((marketValueResult[0]?.marketValue || 0) * 100) / 100,
		volumesWithCoverPrice:
			marketValueResult[0]?.volumesWithCoverPrice || 0,
		averageCoverPricePerVolume:
			marketValueResult[0]?.volumesWithCoverPrice > 0
				? Math.round(
						(marketValueResult[0].marketValue /
							marketValueResult[0].volumesWithCoverPrice) *
							100,
					) / 100
				: 0,
	};

	if (isOwner) {
		stats.totalSpent = Math.round(totalSpent * 100) / 100;
		stats.averagePaidPricePerVolume =
			totalTrackedVolumes > 0
				? Math.round((totalSpent / totalTrackedVolumes) * 100) / 100
				: 0;
		stats.volumesWithPaidPrice = totalTrackedVolumes;
		stats.coverValueOfVolumesWithoutPaidPrice =
			Math.round((marketValueResult[0]?.coverValueOfVolumesWithoutPaidPrice || 0) * 100) / 100;
		stats.spendingBySeries = spendingBySeries
			.filter((s) => s.total > 0)
			.map((s) => ({
			name: s.name,
			count: Math.round(s.total * 100) / 100,
		}));
	}

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
	const regex = new RegExp(escapeRegex(req.query.q), "i");
	const page = parseInt(req.query.p) || 1;
	const users_per_page = 12;
	const skip = users_per_page * (page - 1);
	const users = await User.aggregate([
		{ $match: { username: regex } },
		{
			$project: {
				username: 1,
				profileImageUrl: 1,
				profileBannerUrl: 1,
				followersCount: { $size: { $ifNull: ["$followers", []] } },
			},
		},
		{ $sort: { followersCount: -1, username: 1, _id: 1 } },
		{ $skip: skip },
		{ $limit: users_per_page },
	]).collation({ locale: "en", strength: 2 });
	return res.send(users);
});

exports.getUserFilters = asyncHandler(async (req, res, next) => {
	const targetUser = req.params.username;
	if (!targetUser)
		return res.status(400).json({ msg: "Nenhum usuário informado" });

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
				types: [
					{ $match: { "series.type": { $ne: null, $nin: [""] } } },
					{
						$group: {
							_id: null,
							types: { $addToSet: "$series.type" },
						},
					},
				],
				demographics: [
					{ $match: { "series.demographic": { $ne: null, $nin: [""] } } },
					{
						$group: {
							_id: null,
							demographics: { $addToSet: "$series.demographic" },
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
				types: {
					$cond: [
						{ $gt: [{ $size: "$types" }, 0] },
						{
							$sortArray: {
								input: { $arrayElemAt: ["$types.types", 0] },
								sortBy: 1,
							},
						},
						[],
					],
				},
				demographics: {
					$cond: [
						{ $gt: [{ $size: "$demographics" }, 0] },
						{
							$sortArray: {
								input: { $arrayElemAt: ["$demographics.demographics", 0] },
								sortBy: 1,
							},
						},
						[],
					],
				},
			},
		},
	]);

	return res.send(
		result[0] || { genres: [], publishers: [], types: [], demographics: [] }
	);
});

const getVolumeScores = async (ownerId, volumes) => {
	const scoreByVolumeId = new Map();
	if (volumes.length === 0) return scoreByVolumeId;
	const ratings = await Rating.find({
		user: ownerId,
		volume: { $in: volumes.map((volume) => volume._id) },
	}).select("volume score");
	for (const rating of ratings) {
		scoreByVolumeId.set(rating.volume.toString(), rating.score);
	}
	return scoreByVolumeId;
};

exports.getUserReadList = asyncHandler(async (req, res, next) => {
	const targetUser = req.params.username?.trim();
	if (!targetUser)
		return res.status(400).send({ msg: "Usuário não encontrado" });

	const page = parseInt(req.query.p) || 1;
	const shiftOffset = parseInt(req.query.offset) || 0;
	const calculatedSkip = ITEMS_PER_PAGE * (page - 1) - shiftOffset;
	const skip = Math.max(0, calculatedSkip);
	const filter = buildFilter(req.query, "seriesInfo");

	if (req.query.group) {
		const bool = req.query.group === "true" ? true : false;
		filter["ownedVolumes.isRead"] = bool;
	}
	const ordering = req.query.ordering || "title";
	const sortStage = buildVolumeSortStage(ordering);

	const owner = await User.findOne({ username: targetUser }).select("_id");
	const myRatingStages =
		ordering === "myRating" && owner
			? buildVolumeMyRatingLookupStages(owner._id, "$volumeInfo._id")
			: [];

	const isOwner = req.user?.username === targetUser;
	const pipeline = buildVolumeAggregationPipeline(
		targetUser,
		filter,
		sortStage,
		skip,
		myRatingStages,
		isOwner,
	);
	const userCollection = await User.aggregate(pipeline);

	const scoreByVolumeId = owner
		? await getVolumeScores(owner._id, userCollection)
		: new Map();

	const filteredList = userCollection.map((volume) => {
		const seriesObject = {
			title: volume.title,
		};
		let image = getVolumeCoverURL(
			seriesObject,
			volume.volumeNumber,
			volume.isVariant,
			volume.variantNumber,
		);
		if (volume.isAdult && !req.user?.allowAdult) {
			image = null;
		}

		const score = scoreByVolumeId.get(volume._id.toString());
		const ratingScore = score != null ? Math.round(score) : null;

		return {
			...volume,
			image: image,
			ratingScore,
			isDerived: false,
		};
	});
	res.send(filteredList);
});

const TABLE_ITEMS_PER_PAGE = 50;

exports.getUserVolumesTable = asyncHandler(async (req, res, next) => {
	const targetUser = req.params.username?.trim();
	if (!targetUser)
		return res.status(400).send({ msg: "Usuário não encontrado" });

	const owner = await User.findOne({ username: targetUser }).select("_id");
	if (!owner) return res.status(400).send({ msg: "Usuário não encontrado" });

	const page = parseInt(req.query.p) || 1;
	const skip = Math.max(0, TABLE_ITEMS_PER_PAGE * (page - 1));
	const filter = buildFilter(req.query, "seriesInfo");

	const ordering = req.query.ordering || "title";
	const sortStage = buildVolumeSortStage(ordering);

	const myRatingStages =
		ordering === "myRating"
			? buildVolumeMyRatingLookupStages(owner._id, "$volumeInfo._id")
			: [];

	const isOwner = req.user?.username === targetUser;
	const pipeline = buildVolumeAggregationPipeline(
		targetUser,
		filter,
		sortStage,
		skip,
		myRatingStages,
		isOwner,
		{ pageSize: TABLE_ITEMS_PER_PAGE, includeLotSize: true, withTotal: true },
	);
	const [{ items, totalCount }] = await User.aggregate(pipeline);
	const scoreByVolumeId = await getVolumeScores(owner._id, items);

	res.send({
		items: items.map((volume) => ({
			...volume,
			ratingScore: scoreByVolumeId.get(volume._id.toString()) ?? null,
		})),
		total: totalCount[0]?.count || 0,
		page,
		pageSize: TABLE_ITEMS_PER_PAGE,
	});
});
