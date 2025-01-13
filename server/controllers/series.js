const Series = require("../models/Series");
const mongoose = require("mongoose");
const {
	getSeriesCoverURL,
	getVolumeCoverURL,
} = require("../Utils/getCoverFunctions");
const asyncHandler = require("express-async-handler");

const ITEMS_PER_PAGE = 24;

exports.browse = asyncHandler(async (req, res, next) => {
	if (
		req.headers.authorization !== process.env.API_KEY &&
		process.env.NODE_ENV === "production"
	) {
		res.status(401).json({ msg: "Not authorized" });
		return;
	}
	const MIN_SCORE = 1.0;

	const page = parseInt(req.query.p) || 1;
	const skip = ITEMS_PER_PAGE * (page - 1);
	const { publisher, genre } = req.query;
	const search = req.query["search-bar"];

	const filter = {};
	if (genre) filter["genres"] = { $in: [genre] };
	if (publisher) filter["publisher"] = publisher;

	const sortOptions = {
		title: "title",
		publisher: "publisher",
		volumes: "volumesLength",
		date: "releaseDate",
	};
	const ordering = req.query.ordering || "title";
	const sortStage = {};
	sortStage[sortOptions[ordering]] = 1;
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
	const allowAdultContent = req.user?.allowAdult || false;
	if (!allowAdultContent) {
		pipeline.push({ $match: { "isAdult": false } });
	}


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
			},
		},
		{ $skip: skip },
		{ $limit: ITEMS_PER_PAGE }
	);
	const seriesList = await Series.aggregate(pipeline).exec();

	const searchResults = seriesList
		.map((serie) => ({
			...serie,
			image: getSeriesCoverURL(serie),
		}))
	res.send(searchResults);
});

exports.getSeriesDetails = asyncHandler(async (req, res, next) => {
	if (
		req.headers.authorization !== process.env.API_KEY &&
		process.env.NODE_ENV === "production"
	) {
		res.status(401).json({ msg: "Not authorized" });
		return;
	}
	const validId = mongoose.Types.ObjectId.isValid(req.params.id);
	if (!validId) {
		res.status(400).json({ msg: "Series not found" });
		return;
	}

	const desiredSeries = await Series.findById(req.params.id)
		.populate({
			path: "volumes",
			options: { sort: { number: 1 } }, // Sort populated volumes by their number field
		})
		.exec();
	if (desiredSeries === null) {
		res.status(400).json({ msg: "Seried not found" });
		return;
	}
	const volumesWithImages = desiredSeries.volumes.map((volume) => ({
		volumeId: volume._id,
		volumeNumber: volume.number,
		image: getVolumeCoverURL(desiredSeries, volume.number),
	}));

	const {
		_id: id,
		title,
		authors,
		publisher,
		seriesCover,
		dimmensions,
		summary,
		genres,
		isAdult,
		status,
	} = desiredSeries;

	const jsonResponse = {
		id,
		title,
		authors,
		publisher,
		seriesCover,
		dimmensions,
		summary,
		genres,
		isAdult,
		status,
		volumes: volumesWithImages,
	};
	res.send(jsonResponse);
});
