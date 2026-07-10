const User = require("../../models/User");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendEmail } = require("../../Utils/sendEmail");
const logger = require("../../Utils/logger");

exports.signup = asyncHandler(async (req, res, next) => {
	const username = req.body.username.trim();
	const email = req.body.email.toLowerCase().trim();
	const { password } = req.body;
	const existingUser = await User.findOne({ $or: [{ username }, { email }] });

	if (existingUser) {
		return res.status(409).json({ msg: "Email ou nome de usuário já existe" });
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
	const loginLowerCase = req.body.login.toLowerCase().trim();
	const loginOriginalCase = req.body.login;
	const { password } = req.body;
	const user = await User.findOne({
		$or: [{ username: loginOriginalCase }, { email: loginLowerCase }],
	});

	if (!user || !user.password) {
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
	try {
		await sendEmail(user.email, "Mudança de senha", "forgotEmail", {
			username: user.username,
			link: `${process.env.HOST_ORIGIN}/reset/${urlCode}`,
		});
		res.send({ msg: "Email enviado com sucesso" });
	} catch (error) {
		logger.error("Reset email failed:", error);
		res.status(500).json({ msg: "Erro ao enviar o email" });
	}
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
	const { userId, token, password } = req.body;
	if (!token || !userId) {
		return res.status(400).json({ msg: "Link inválido" });
	}
	const user = await User.findOne({ _id: userId }).select(
		"token tokenTimestamp",
	);
	if (!user || !user.token || !user.tokenTimestamp) {
		return res.status(400).json({ msg: "Link inválido" });
	}

	const provided = String(token);
	if (
		user.token.length !== provided.length ||
		!crypto.timingSafeEqual(Buffer.from(user.token), Buffer.from(provided))
	) {
		return res.status(400).json({ msg: "Link inválido" });
	}

	if (new Date() > user.tokenTimestamp) {
		return res.status(400).json({ msg: "Link expirado" });
	}
	const newHashedPassword = await bcrypt.hash(password, 10);
	user.password = newHashedPassword;
	user.token = null;
	user.tokenTimestamp = null;
	await user.save();
	res.send({ msg: "Senha alterada com sucesso" });
});
exports.getLoggedUser = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user._id)
		.populate({
			path: "userList.Series",
			select: "title",
		})
		.lean()
		.exec();

	if (!user) return res.send({ msg: "Usuário não encontrado" });

	const notificationCount =
		user.notifications?.reduce((count, currentNotification) => {
			return count + (!currentNotification.seen ? 1 : 0);
		}, 0) ?? 0;

	const userInfo = {
		_id: user._id,
		username: user.username,
		userList: user.userList,
		ownedVolumes: user.ownedVolumes,
		profileImageUrl: user.profileImageUrl,
		profileBannerUrl: user.profileBannerUrl,
		settings: user.settings,
		email: user.email,
		allowAdult: user.allowAdult,
		wishList: user.wishList,
		notificationCount,
		isAdmin: user.isAdmin,
	};
	return res.send(userInfo);
});
