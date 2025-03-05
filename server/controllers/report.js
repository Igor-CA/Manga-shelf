const Report = require("../models/reports");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

exports.createReport = [
	body("details")
		.trim()
		.notEmpty()
		.withMessage("Detalhes devem ser especificados.")
		.escape(),
	body("local")
		.trim()
		.notEmpty()
		.withMessage("O local deve ser especificado.")
		.escape(),
	body("page")
		.trim()
		.notEmpty()
		.withMessage("A página em específico deve ser citada.")
		.escape(),
	body("type")
		.trim()
		.notEmpty()
		.withMessage("O tipo de sugestão deve ser especificada.")
		.escape(),
	body("user").trim().escape(),

	asyncHandler(async (req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ msg: errors.array() });
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
		res.status(201).json({ msg: "Sugestão criada com sucesso" });
	}),
];
