const User = require("../../models/User");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendEmail } = require("../../Utils/sendEmail");

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

exports.resetPassword = asyncHandler(async (req, res, next) => {
	const user = await User.findOne({ _id: req.body.userId });
	if (!user) {
		return res.status(400).json({ msg: "Esse usuário não existe" });
	}

	if (user.token !== req.body.token) {
		return res.status(400).json({ msg: "Link inválido" });
	}

	const currentTimeStamp = new Date();
	if (currentTimeStamp > user.tokenTimestamp) {
		return res.status(400).json({ msg: "Link expirado" });
	}

	const newHashedPassword = await bcrypt.hash(req.body.password, 10);
	user.password = newHashedPassword;
	user.token = null;
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
