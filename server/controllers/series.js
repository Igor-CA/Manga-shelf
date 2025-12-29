const Series = require("../models/Series");
const mongoose = require("mongoose");
const {
	getSeriesCoverURL,
	getVolumeCoverURL,
} = require("../Utils/getCoverFunctions");
const asyncHandler = require("express-async-handler");

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
		}
	);
};

exports.browse = asyncHandler(async (req, res, next) => {
	const MIN_SCORE = 1.0;

	const page = parseInt(req.query.p) || 1;
	const skip = ITEMS_PER_PAGE * (page - 1);
	const { publisher, genre, status } = req.query;
	const search = req.query["search"];

	const filter = {};
	if (genre) filter["genres"] = { $in: [genre] };
	if (publisher) filter["publisher"] = publisher;
	if (status) filter["status"] = status;

	const sortOptions = {
		// Order 1 for ascending and 2 for descending
		popularity: { atribute: "popularity", order: -1 },
		title: { atribute: "title", order: 1 },
		publisher: { atribute: "publisher", order: 1 },
		volumes: { atribute: "volumesLength", order: -1 },
		date: { atribute: "releaseDate", order: 1 },
	};
	const ordering = req.query.ordering || "popularity";
	const sortStage = {};
	sortStage[sortOptions[ordering].atribute] = sortOptions[ordering].order;
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
		{ $sort: sortStage }
	);
	addUserListData(pipeline, req.user);

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
			{ $sort: { score: -1, ...sortStage } }
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
		{ $limit: ITEMS_PER_PAGE }
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
		image: getVolumeCoverURL(desiredSeries, volume.number, volume.isVariant),
		isAdult: desiredSeries.isAdult,
		isVariant: volume.isVariant,
	}));

	const { _id: id, __v, ...rest } = desiredSeries;
	const jsonResponse = { id, ...rest, volumes: volumesWithImages };
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

	res.send(result[0] || { genres: [], publishers: [] });
});
