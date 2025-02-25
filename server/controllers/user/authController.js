const User = require("../../models/User");
const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

exports.signup = asyncHandler(async (req, res, next) => {
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

exports.login = asyncHandler(async (req, res, next) => {
	const { login, password } = req.body;
	const user = await User.findOne({
		$or: [{ username: login }, { email: login }],
	});

	if (!user) {
		return res
			.status(401)
			.json({ msg: "Usuário ou senha errados, tente novamente." });
	}
	const compareResult = await bcrypt.compare(password, user.password);
	if (!compareResult) {
		return res
			.status(401)
			.json({ msg: "Usuário ou senha errados, tente novamente." });
	}

	await new Promise((resolve, reject) => {
		req.logIn(user, (err) => {
			if (err) return reject(err);
			resolve();
		});
	});

	res.json({ msg: "Usuário logado com sucesso" });
});

exports.logout = (req, res, next) => {
	req.logout(function (err) {
		if (err) {
			return next(err);
		}
		res.send({ msg: "Deslogado com sucesso" });
	});
};

exports.sendResetEmail = asyncHandler(async (req, res, next) => {
	const user = await User.findOne({ email: req.body.email });

	if (!user) {
		return res
			.status(401)
			.json({ msg: "Nenhum usuário com esse email encontrado" });
	}

	const tokenLength = 32;
	const token = crypto.randomBytes(tokenLength).toString("hex");
	
	const timestamp = Date.now() + 15 * 60 * 1000; // 15 min later
	
	user.tokenTimestamp = timestamp;
	user.token = token;
	await user.save();
	

	const urlCode = `${user._id}/${token}`;
	sendEmail(user.email, "Mudança de senha", "forgotEmail", {
		username: user.username,
		link: `${process.env.HOST_ORIGIN}/reset/${urlCode}`,
	})
		.then(() => res.send({ msg: "Email enviado com sucesso" }))
		.catch((error) => res.send(error));
	return;
});
