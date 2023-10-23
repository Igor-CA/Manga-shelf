const Report = require("../models/reports");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

exports.createReport = [
	body("details")
		.trim()
		.notEmpty()
		.withMessage("details must be specified.")
		.escape(),
	body("local")
		.trim()
		.notEmpty()
		.withMessage("local must be specified.")
		.escape(),
	body("page")
		.trim()
		.notEmpty()
		.withMessage("page must be specified.")
		.escape(),
	body("type")
		.trim()
		.notEmpty()
		.withMessage("type must be specified.")
		.escape(),
	body("user").trim().escape(),

	asyncHandler(async (req, res, next) => {
		if (req.headers.authorization !== process.env.API_KEY) {
			res.status(401).json({ msg: "Not authorized" });
			return;
		}
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ message: errors.array() });
		}

		const { details, local, page, type, user } = req.body;

		const newReport = new Report({
			details,
			local,
			page,
			type,
			user,
		});
		await newReport.save();
		res.status(201).json({ message: "Report created successfully" });
	}),
];
