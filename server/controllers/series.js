const Series = require("../models/Series");
const mongoose = require("mongoose");
const {
	getSeriesCoverURL,
	getVolumeCoverURL,
} = require("../Utils/getCoverFunctions");
const asyncHandler = require("express-async-handler");

const ITEMS_PER_PAGE = 24;

async function getSeriesList(page) {
	const skip = ITEMS_PER_PAGE * (page - 1);
	const seriesList = await Series.find({ isAdult: false }, "title")
		.sort({ title: 1 })
		.skip(skip)
		.limit(ITEMS_PER_PAGE)
		.exec();

	const formattedSeriesList = seriesList.map(({ _doc, seriesCover }) => ({
		..._doc,
		image: seriesCover,
	}));
	return formattedSeriesList;
}
async function searchSeries(page, query) {
	const MIN_SCORE = 1.0; 
	
	const skip = ITEMS_PER_PAGE * (page - 1);
	const seriesList = await Series.aggregate([
		{
			$search: {
				index: "SeriesSearchIndex",
				compound: {
					should: [
						{
							text: {
								query: query,
								path: "authors",
								fuzzy: { maxEdits: 2, prefixLength: 2 },
								score: { boost: { value: 1.5 } },
							},
						},
						{
							text: {
								query: query,
								path: "title",
								fuzzy: { maxEdits: 2, prefixLength: 2 },
								score: { boost: { value: 1.75 } },
							},
						},
						{
							text: {
								query: query,
								path: "synonyms",
								fuzzy: { maxEdits: 2, prefixLength: 2 },
								score: { boost: { value: 1.5 } },
							},
						},
					],
				},
			},
		},
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
		{
			$project: {
				title: 1,
				isAdult: 1,
			},
		},
	])
		.skip(skip)
		.limit(ITEMS_PER_PAGE)
		.exec();

	const searchResults = seriesList
		.map((serie) => ({
			...serie,
			image: getSeriesCoverURL(serie),
		}))
		.filter((series) => series.isAdult === false);

	return searchResults;
}

exports.browse = asyncHandler(async (req, res, next) => {
	if (req.headers.authorization !== process.env.API_KEY) {
		res.status(401).json({ msg: "Not authorized" });
		return;
	}
	const page = req.query.p ? Number(req.query.p) : 1;
	const query = req.query.q;
	const result = query
		? await searchSeries(page, query)
		: await getSeriesList(page);
	res.send(result);
});


exports.getSeriesDetails = asyncHandler(async (req, res, next) => {
	if (req.headers.authorization !== process.env.API_KEY) {
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
