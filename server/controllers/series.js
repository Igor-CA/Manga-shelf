const Series = require("../models/Series");
const mongoose = require("mongoose");
const {
	getSeriesCoverURL,
	getVolumeCoverURL,
} = require("../Utils/getCoverFunctions");
const asyncHandler = require("express-async-handler");
const Volume = require("../models/volume");
const User = require("../models/User");
const Notification = require("../models/Notification");
const logger = require("../Utils/logger");

const ITEMS_PER_PAGE = 24;
const addUserListData = (pipeline, user) => {
	if (!user) {
		pipeline.push({
			$addFields: {
				inWishlist: false,
				inUserList: false,
				userListStatus: null,
			},
		});
		return;
	}

	const userId = user._id;

	pipeline.push(
		{
			$lookup: {
				from: "users",
				let: { seriesId: "$_id" },
				pipeline: [
					{ $match: { _id: userId } },
					{
						$project: {
							inWishlist: {
								$in: ["$$seriesId", { $ifNull: ["$wishList", []] }],
							},
							inUserList: {
								$in: ["$$seriesId", { $ifNull: ["$userList.Series", []] }],
							},
							userListStatus: {
								$let: {
									vars: {
										matchedElement: {
											$arrayElemAt: [
												{
													$filter: {
														input: { $ifNull: ["$userList", []] },
														as: "item",
														cond: { $eq: ["$$item.Series", "$$seriesId"] },
													},
												},
												0, // Get the first (and only) match
											],
										},
									},
									in: "$$matchedElement.status",
								},
							},
						},
					},
				],
				as: "userData",
			},
		},
		{
			$unwind: {
				path: "$userData",
				preserveNullAndEmptyArrays: true,
			},
		},
		{
			$addFields: {
				inWishlist: { $ifNull: ["$userData.inWishlist", false] },
				inUserList: { $ifNull: ["$userData.inUserList", false] },
				userListStatus: { $ifNull: ["$userData.userListStatus", null] },
			},
		},
		{
			$project: {
				userData: 0,
			},
		},
	);
};

exports.browse = asyncHandler(async (req, res, next) => {
	const MIN_SCORE = 1.0;

	const page = parseInt(req.query.p) || 1;
	const skip = ITEMS_PER_PAGE * (page - 1);
	const {
		publisher,
		genre,
		status,
		demographic,
		type,
		publishedAtJp,
		publishedAtBr,
		onlyOwned,
		hideOwned,
		country,
	} = req.query;
	const search = req.query["search"];

	const filter = {};
	if (genre) filter["genres"] = { $in: [genre] };
	if (publisher) filter["publisher"] = publisher;
	if (status) filter["status"] = status;
	if (demographic) filter["demographic"] = demographic;
	if (type) filter["type"] = type;
	if (country) filter["originalRun.country"] = country;
	if (onlyOwned) {
		filter["$or"] = [{ inUserList: true }, { inWishlist: true }];
	}
	if (hideOwned) {
		filter["$and"] = [{ inUserList: false }, { inWishlist: false }];
	}

	if (publishedAtBr) {
		const year = parseInt(publishedAtBr);
		filter["dates.publishedAt"] = {
			$gte: new Date(Date.UTC(year, 0, 1)),
			$lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59)),
		};
	}

	if (publishedAtJp) {
		const year = parseInt(publishedAtJp);
		filter["originalRun.dates.publishedAt"] = {
			$gte: new Date(Date.UTC(year, 0, 1)),
			$lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59)),
		};
	}

	const sortOptions = {
		// Order 1 for ascending and 2 for descending
		popularity: { attribute: "popularity", order: -1 },
		title: { attribute: "title", order: 1 },
		publisher: { attribute: "publisher", order: 1 },
		volumes: { attribute: "volumesLength", order: -1 },
		dateJp: { attribute: "originalRun.dates.publishedAt", order: -1 },
		dateBr: { attribute: "dates.publishedAt", order: -1 },
	};
	const ordering = req.query.ordering || "popularity";
	const sortStage = {};
	sortStage[sortOptions[ordering].attribute] = sortOptions[ordering].order;
	sortStage["title"] = 1;
	const isValidSearch = search && search.trim() !== "";

	let pipeline = [];

	if (isValidSearch) {
		pipeline.push({
			$search: {
				index:
					process.env.NODE_ENV === "production"
						? "SeriesSearchIndex"
						: "dev-searchIndex",
				compound: {
					should: [
						{
							text: {
								query: search,
								path: "authors",
								fuzzy: { maxEdits: 2, prefixLength: 2 },
								score: { boost: { value: 1.5 } },
							},
						},
						{
							text: {
								query: search,
								path: "title",
								fuzzy: { maxEdits: 2, prefixLength: 2 },
								score: { boost: { value: 1.75 } },
							},
						},
						{
							text: {
								query: search,
								path: "synonyms",
								fuzzy: { maxEdits: 2, prefixLength: 2 },
								score: { boost: { value: 1.5 } },
							},
						},
					],
				},
			},
		});
	} else {
		pipeline.push({
			$match: {},
		});
	}
	addUserListData(pipeline, req.user);
	pipeline.push(
		{
			$lookup: {
				from: "volumes",
				localField: "volumes",
				foreignField: "_id",
				as: "volume",
			},
		},

		{
			$addFields: {
				firstVolume: { $arrayElemAt: ["$volumes", 0] },
				volumesLength: { $size: "$volumes" },
			},
		},
		{
			$lookup: {
				from: "volumes",
				localField: "firstVolume",
				foreignField: "_id",
				as: "firstVolume",
			},
		},
		{
			$addFields: {
				releaseDate: { $arrayElemAt: ["$firstVolume.date", 0] },
			},
		},
		{ $match: filter },
		{ $sort: sortStage },
	);

	if (isValidSearch) {
		pipeline.push(
			{
				$addFields: {
					score: { $meta: "searchScore" },
				},
			},
			{
				$match: {
					score: { $gte: MIN_SCORE },
				},
			},
			{ $sort: { score: -1, ...sortStage } },
		);
	}
	pipeline.push(
		{
			$project: {
				title: 1,
				isAdult: 1,
				inWishlist: 1,
				inUserList: 1,
				userListStatus: 1,
			},
		},
		{ $skip: skip },
		{ $limit: ITEMS_PER_PAGE },
	);
	const seriesList = await Series.aggregate(pipeline).exec();

	const searchResults = seriesList.map((series) => {
		let image = getSeriesCoverURL(series);

		if (series.isAdult && !req.user?.allowAdult) {
			image = null;
		}
		return {
			...series,
			image: image,
		};
	});
	res.send(searchResults);
});

exports.getSeriesDetails = asyncHandler(async (req, res, next) => {
	const validId = mongoose.Types.ObjectId.isValid(req.params.id);
	if (!validId) {
		res.status(400).json({ msg: "Series not found" });
		return;
	}
	const seriesId = new mongoose.Types.ObjectId(req.params.id);

	let pipeline = [
		{ $match: { _id: seriesId } },

		{
			$unwind: {
				path: "$relatedSeries",
				preserveNullAndEmptyArrays: true,
			},
		},

		{
			$lookup: {
				from: "series",
				localField: "relatedSeries.series",
				foreignField: "_id",
				as: "relatedSeriesData",
			},
		},

		{
			$unwind: {
				path: "$relatedSeriesData",
				preserveNullAndEmptyArrays: true,
			},
		},

		{
			$group: {
				_id: "$_id",
				root: { $first: "$$ROOT" },
				related: {
					$push: {
						relation: "$relatedSeries.relation",
						title: "$relatedSeriesData.title",
						isAdult: "$relatedSeriesData.isAdult",
						seriesId: "$relatedSeriesData._id",
					},
				},
			},
		},

		{
			$replaceRoot: {
				newRoot: {
					$mergeObjects: [
						"$root",
						{
							related: {
								$filter: {
									input: "$related",
									as: "item",
									cond: { $ifNull: ["$$item.seriesId", false] },
								},
							},
						},
					],
				},
			},
		},

		{
			$project: {
				relatedSeries: 0,
				relatedSeriesData: 0,
			},
		},

		{
			$lookup: {
				from: "volumes",
				localField: "volumes",
				foreignField: "_id",
				as: "volumes",
				pipeline: [{ $sort: { number: 1 } }],
			},
		},
	];
	addUserListData(pipeline, req.user);
	const seriesResult = await Series.aggregate(pipeline).exec();
	if (seriesResult.length === 0) {
		res.status(400).json({ msg: "Series not found" });
		return;
	}
	const desiredSeries = seriesResult[0];
	desiredSeries.seriesCover = getSeriesCoverURL(desiredSeries);
	const volumesWithImages = desiredSeries.volumes.map((volume) => ({
		volumeId: volume._id,
		volumeNumber: volume.number,
		image: getVolumeCoverURL(
			desiredSeries,
			volume.number,
			volume.isVariant,
			volume.variantNumber,
		),
		isAdult: desiredSeries.isAdult,
		isVariant: volume.isVariant,
	}));

	const relatedInfoImages = desiredSeries.related.map((series) => {
		return {
			image: getSeriesCoverURL(series),
			...series,
		};
	});

	const { _id: id, __v, ...rest } = desiredSeries;
	const jsonResponse = {
		id,
		...rest,
		volumes: volumesWithImages,
		related: relatedInfoImages,
	};
	res.send(jsonResponse);
});

exports.getInfoFilters = asyncHandler(async (req, res, next) => {
	const result = await Series.aggregate([
		{
			$facet: {
				genres: [
					{ $unwind: "$genres" },
					{ $match: { genres: { $ne: null, $nin: [""] } } },
					{
						$group: {
							_id: null,
							genres: { $addToSet: "$genres" },
						},
					},
				],
				publishers: [
					{ $match: { publisher: { $ne: null, $nin: [""] } } },
					{
						$group: {
							_id: null,
							publishers: { $addToSet: "$publisher" },
						},
					},
				],
				types: [
					{ $match: { type: { $ne: null, $nin: [""] } } },
					{
						$group: {
							_id: null,
							types: { $addToSet: "$type" },
						},
					},
				],
				countries: [
					{ $match: { "originalRun.country": { $ne: null } } },
					{
						$group: {
							_id: null,
							countries: { $addToSet: "$originalRun.country" },
						},
					},
				],
				publishedYears: [
					{ $match: { "dates.publishedAt": { $ne: null } } },
					{
						$group: {
							_id: null,
							years: { $addToSet: { $year: "$dates.publishedAt" } },
						},
					},
				],
				originalPublishedYears: [
					{ $match: { "originalRun.dates.publishedAt": { $ne: null } } },
					{
						$group: {
							_id: null,
							years: { $addToSet: { $year: "$originalRun.dates.publishedAt" } },
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
				countries: {
					$cond: [
						{ $gt: [{ $size: "$countries" }, 0] },
						{
							$sortArray: {
								input: { $arrayElemAt: ["$countries.countries", 0] },
								sortBy: 1,
							},
						},
						[],
					],
				},
				publishedYears: {
					$cond: [
						{ $gt: [{ $size: "$publishedYears" }, 0] },
						{
							$sortArray: {
								input: { $arrayElemAt: ["$publishedYears.years", 0] },
								sortBy: -1,
							},
						},
						[],
					],
				},
				originalPublishedYears: {
					$cond: [
						{ $gt: [{ $size: "$originalPublishedYears" }, 0] },
						{
							$sortArray: {
								input: { $arrayElemAt: ["$originalPublishedYears.years", 0] },
								sortBy: -1,
							},
						},
						[],
					],
				},
			},
		},
	]);

	res.send(
		result[0] || {
			genres: [],
			publishers: [],
			types: [],
			countrys: [],
			publishedYears: [],
			originalPublishedYears: [],
		},
	);
});
exports.deleteSeriesAndNotify = async (req, res) => {
	const { seriesId, reason } = req.body;

	if (!seriesId || !reason) {
		return res
			.status(400)
			.json({ message: "Series ID and Reason are required." });
	}

	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const series = await Series.findById(seriesId).session(session);
		if (!series) {
			await session.abortTransaction();
			return res.status(404).json({ message: "Series not found." });
		}

		const relatedVolumes = await Volume.find({ serie: seriesId })
			.select("_id")
			.session(session);

		const relatedVolumeIds = relatedVolumes.map((v) => v._id);

		const affectedUsers = await User.find({
			$or: [
				{ "userList.Series": seriesId },
				{ wishList: seriesId },
				{ "ownedVolumes.volume": { $in: relatedVolumeIds } },
			],
		})
			.select("_id")
			.session(session);

		const affectedUserIds = affectedUsers.map((u) => u._id);

		const deletionNotification = new Notification({
			type: "media", 
			text: `A obra **${series.title}** foi removida do site.`,
			details: [`Motivo: ${reason}`],
			objectType: "Series",
		});

		await deletionNotification.save({ session });

		if (affectedUserIds.length > 0) {
			await User.updateMany(
				{ _id: { $in: affectedUserIds } },
				{
					$pull: {
						userList: { Series: seriesId },
						wishList: seriesId,
						ownedVolumes: { volume: { $in: relatedVolumeIds } },
					},
					$push: {
						notifications: {
							notification: deletionNotification._id,
							seen: false,
							date: new Date(),
						},
					},
				},
			).session(session);
		}

		const oldNotifications = await Notification.find({
			$or: [
				{ associatedObject: seriesId, objectType: "Series" },
				{ associatedObject: { $in: relatedVolumeIds }, objectType: "Volume" },
			],
		}).session(session);

		const oldNotificationIds = oldNotifications.map((n) => n._id);

		if (oldNotificationIds.length > 0) {
			await User.updateMany(
				{ "notifications.notification": { $in: oldNotificationIds } },
				{
					$pull: {
						notifications: { notification: { $in: oldNotificationIds } },
					},
				},
			).session(session);

			await Notification.deleteMany({
				_id: { $in: oldNotificationIds },
			}).session(session);
		}

		await Series.updateMany(
			{ "relatedSeries.series": seriesId },
			{ $pull: { relatedSeries: { series: seriesId } } }
		).session(session);

		await Volume.deleteMany({ serie: seriesId }).session(session);

		await Series.deleteOne({ _id: seriesId }).session(session);

		await session.commitTransaction();
		session.endSession();

		logger.warn(`Series removed by ${req.user.username}`);

		return res.status(200).json({
			success: true,
			message: `Series "${series.title}" and ${relatedVolumeIds.length} volumes deleted. ${affectedUserIds.length} users notified.`,
		});
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		logger.error("Delete Series Error:", error);
		return res
			.status(500)
			.json({ message: "Internal Server Error", error: error.message });
	}
};
