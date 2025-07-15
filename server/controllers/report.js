const Report = require("../models/reports");
const asyncHandler = require("express-async-handler");

exports.createReport = asyncHandler(async (req, res, next) => {
	const { details, local, page, type, user } = req.body;
	const newReport = new Report({
		details,
		local,
		page,
		type,
		user,
	});
	await newReport.save();
	res.status(201).json({ msg: "Sugestão criada com sucesso" });
});
