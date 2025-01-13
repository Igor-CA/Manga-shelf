const Volume = require("../models/volume");
const mongoose = require("mongoose");
const { getVolumeCoverURL } = require("../Utils/getCoverFunctions");
const asyncHandler = require("express-async-handler");
const ITEMS_PER_PAGE = 10;
exports.all = asyncHandler(async (req, res, next) => {
	if (req.headers.authorization !== process.env.API_KEY && process.env.NODE_ENV === "production") {
		res.status(401).json({ msg: "Not authorized" });
		return;
	}
	const page = req.query.p ? Number(req.query.p) : 0;
	const skip = ITEMS_PER_PAGE * page;
	const volumes = await Volume.find({}, "number")
		.populate("serie", "title")
		.skip(skip)
		.limit(ITEMS_PER_PAGE)
		.exec();

	res.send(volumes);
});

exports.getVolumeDetails = asyncHandler(async (req, res, next) => {
	if (req.headers.authorization !== process.env.API_KEY && process.env.NODE_ENV === "production") {
		res.status(401).json({ msg: "Not authorized" });
		return;
	}
	const validId = mongoose.Types.ObjectId.isValid(req.params.id);
	if (!validId) {
		res.status(400).json({ msg: "volume not found" });
		return;
	}

	const desiredVolume = await Volume.findById(req.params.id)
		.populate("serie", "title volumes isAdult")
		.exec();

	if (!desiredVolume) {
		res.status(400).json({ msg: "volume not found" });
		return;
	}

	const { serie, number } = desiredVolume;
	res.send({ ...desiredVolume._doc, image: getVolumeCoverURL(serie, number) });
});
