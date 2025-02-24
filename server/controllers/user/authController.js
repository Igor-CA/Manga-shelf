const User = require("../../models/User");
const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

exports.signup = asyncHandler(async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		console.log(errors);
		return res
			.status(400)
			.json({ msg: errors.array().map((erro) => erro.msg) });
	}

	const { username, password, email } = req.body;

	const existingUser = await User.findOne({ $or: [{ username }, { email }] });

	if (existingUser) {
		return res
			.status(409)
			.json({ msg: "Email ou nome de usuário já existe" });
	}

	const hashedPassword = await bcrypt.hash(password, 10);
	const newUser = new User({
		username,
		password: hashedPassword,
		email,
		TOSAcceptedAt: new Date(),
	});
	await newUser.save();
	res.status(201).json({ msg: "Usuário criado com sucesso" });
});
