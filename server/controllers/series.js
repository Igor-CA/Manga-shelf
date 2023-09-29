const Series = require("../models/Series");
const mongoose = require('mongoose');
const {
	getSeriesCoverURL,
	getVolumeCoverURL,
} = require("../Utils/getCoverFunctions");
const asyncHandler = require("express-async-handler");

const ITEMS_PER_PAGE = 24;
const SEARCH_RESULT_LIMIT = 12;

exports.all = asyncHandler(async (req, res, next) => {
	const currentPage = req.query.p ? Number(req.query.p) : 1;
	const skip = ITEMS_PER_PAGE * (currentPage - 1);
	const seriesList = await Series.find({}, "title")
		.sort({ title: 1 })
		.skip(skip)
		.limit(ITEMS_PER_PAGE)
		.exec();

	const formattedSeriesList = seriesList.map(({ _doc, seriesCover }) => ({
		..._doc,
		image: seriesCover,
	}));
	res.send(formattedSeriesList);
});

exports.searchSeries = asyncHandler(async (req, res, next) => {
	const query = req.query.q;
	const values = await Series.aggregate([
		{
			$search: {
				index: "SeriesSearchIndex",
				compound: {
					should: [
						{
							text: {
								query: query,
								path: "authors",
								fuzzy: {},
							},
						},
						{
							text: {
								query: query,
								path: "title",
								fuzzy: {},
								score: { boost: { value: 2 } },
							},
							text: {
								query: query,
								path: "synonyms",
								fuzzy: {},
								score: { boost: { value: 1.5 } },
							},
						},
					],
				},
			},
		},
		{
			$project: {
				title: 1,
			},
		},
	])
		.limit(SEARCH_RESULT_LIMIT)
		.exec();
	const searchResults = values.map((serie) => ({
		...serie,
		image: getSeriesCoverURL(serie),
	}));
	res.send(searchResults);
});

exports.getSeriesDetails = asyncHandler(async (req, res, next) => {
	const validId = mongoose.Types.ObjectId.isValid(req.params.id)
	if (!validId) {
		res.status(400).json({msg:"Series not found"})
		return
	}

	const desiredSeries = await Series.findById(req.params.id)
		.populate({
			path: "volumes",
			options: { sort: { number: 1 } } // Sort populated volumes by their number field
		})
		.exec();
	if(desiredSeries === null){
		res.status(400).json({msg:"Seried not found"})
		return
	}
	const volumesWithImages = desiredSeries.volumes.map((volume) => ({
		volumeId: volume._id,
		volumeNumber: volume.number,
		image: getVolumeCoverURL(desiredSeries, volume.number),
	}));

	const { _id: id, title, authors, publisher, seriesCover, dimmensions, summary, genres, isAdult, status } = desiredSeries;

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
