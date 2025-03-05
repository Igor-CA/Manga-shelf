const User = require("../../models/User");
const asyncHandler = require("express-async-handler");
const path = require("path");

const multer = require("multer");
const mime = require("mime-types");

const bcrypt = require("bcrypt");

function configureMulter(folder) {
	const storage = multer.diskStorage({
		destination: (req, file, cb) => cb(null, path.resolve(folder)),
		filename: (req, file, cb) => {
			const userId = req.user._id;
			const fileExtension = mime.extension(file.mimetype) || "webp";
			cb(null, `${userId}.${fileExtension}`);
		},
	});

	const fileFilter = (req, file, cb) => {
		const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
		if (!allowedTypes.includes(file.mimetype)) {
			return cb(
				new Error("Invalid file type. Only JPEG, PNG, and WEBP are allowed."),
				false
			);
		}
		cb(null, true);
	};

	return multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });
}

const uploaders = {
	avatar: configureMulter("public/images/avatar"),
	banner: configureMulter("public/images/banner"),
};

function changeUserImage(type, field) {
	if (!uploaders[type]) {
		throw new Error(`Invalid image type: ${type}`);
	}
	return [
		uploaders[type].single("file"),
		asyncHandler(async (req, res) => {
			const user = await User.findById(req.user._id);
			user[field] = `/images/${type}/${req.file.filename}`;
			await user.save();
			res.status(201).json({ msg: "Foto atualizada com sucesso" });
		}),
	];
}
exports.changeProfilePicture = changeUserImage("avatar", "profileImageUrl");
exports.changeProfileBanner = changeUserImage("banner", "profileBannerUrl");

exports.setUserName = asyncHandler(async (req, res, next) => {
	const user = await User.findOne({ username: req.body.username });
	if (user) {
		return res.status(409).json({ msg: "Nome de usuário já existe" });
	}

	await User.findByIdAndUpdate(req.user._id, {
		username: req.body.username,
	});
	res.send({ msg: "Nome atualizado com sucesso" });
});

exports.setUserNotifications = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user._id);
	user.settings.notifications = {
		allow: req.body.enable === "on",
		volumes: req.body.volumes === "on",
		followers: req.body.followers === "on",
		updates: req.body.updates === "on",
		email: req.body["email-notification"] === "on",
		site: req.body["site-notification"] === "on",
	};

	await user.save();
	return res.send({ msg: "Atualizado com sucesso" });
});

exports.changePassword = asyncHandler(async (req, res, next) => {
	const { password } = req.body;
	const hashedPassword = await bcrypt.hash(password, 10);
	await User.findByIdAndUpdate(req.user._id, {
		password: hashedPassword,
	});
	res.status(201).json({ msg: "Senha atualizada com sucesso" });
});
exports.changeEmail = asyncHandler(async (req, res, next) => {
	const { email } = req.body;
	const user = await User.findOne({ email });
	if (user) {
		return res.status(409).json({ msg: "Email já está em uso" });
	}
	await User.findByIdAndUpdate(req.user._id, {
		email,
	});
	res.status(201).json({ msg: "Email atualizado com sucesso" });
});

exports.allowAdultContent = asyncHandler(async (req, res, next) => {
	if (!req.body.allow) {
		await User.findByIdAndUpdate(req.user._id, {
			allowAdult: false,
		});
	}
	await User.findByIdAndUpdate(req.user._id, {
		allowAdult: req.body.allow,
		allowedAdultAt: new Date(),
	});
	res.status(201).json({ msg: "Atualizado com sucesso" });
});
