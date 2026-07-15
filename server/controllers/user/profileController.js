const User = require("../../models/User");
const asyncHandler = require("express-async-handler");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const multer = require("multer");
const mime = require("mime-types");

const bcrypt = require("bcrypt");

function configureMulter() {
	const storage = multer.memoryStorage();

	const fileFilter = (req, file, cb) => {
		const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
		if (!allowedTypes.includes(file.mimetype)) {
			return cb(
				new Error("Invalid file type. Only JPEG, PNG, and WEBP are allowed."),
				false,
			);
		}
		cb(null, true);
	};

	return multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });
}
const uploader = configureMulter();
function changeUserImage(type, field, folderPath) {
	return [
		uploader.single("file"),
		asyncHandler(async (req, res) => {
			if (!req.file)
				return res.status(400).json({ msg: "Nenhum arquivo enviado" });

			const filename = `${req.user._id}.webp`;
			const fullPath = path.resolve(folderPath, filename);

			if (!fs.existsSync(path.resolve(folderPath))) {
				fs.mkdirSync(path.resolve(folderPath), { recursive: true });
			}

			await sharp(req.file.buffer).webp({ quality: 80 }).toFile(fullPath);

			const relativePath = `/images/${type}/${filename}`;

			const user = await User.findById(req.user._id);
			user[field] = relativePath;
			await user.save();

			res
				.status(201)
				.json({ msg: "Foto atualizada com sucesso", url: relativePath });
		}),
	];
}
exports.changeProfilePicture = changeUserImage(
	"avatar",
	"profileImageUrl",
	"public/images/avatar",
);
exports.changeProfileBanner = changeUserImage(
	"banner",
	"profileBannerUrl",
	"public/images/banner",
);
exports.setUserName = asyncHandler(async (req, res, next) => {
	const username = req.body.username.trim();
	const user = await User.findOne({ username });
	if (user) {
		return res.status(409).json({ msg: "Nome de usuário já existe" });
	}

	try {
		await User.findByIdAndUpdate(req.user._id, { username });
	} catch (err) {
		if (err.code === 11000) {
			return res.status(409).json({ msg: "Nome de usuário já existe" });
		}
		throw err;
	}
	res.send({ msg: "Nome atualizado com sucesso" });
});

exports.setUserNotifications = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user._id);
	user.settings.notifications = {
		allow: req.body.enable === "on",
		email: req.body["email-notification"] === "on",
		site: req.body["site-notification"] === "on",
		groups: {
			media: req.body.media === "on",
			social: req.body.social === "on",
			system: req.body.system === "on",
		},
	};

	await user.save();
	return res.send({ msg: "Atualizado com sucesso" });
});

async function verifyCurrentPassword(userId, currentPassword) {
	const user = await User.findById(userId).select("password").lean();
	if (!user) return { error: { status: 404, msg: "Usuário não encontrado" } };
	if (!user.password) return { ok: true };

	if (!currentPassword) {
		return { error: { status: 400, msg: "Informe sua senha atual" } };
	}
	const matches = await bcrypt.compare(currentPassword, user.password);
	if (!matches) {
		return { error: { status: 401, msg: "Senha atual incorreta" } };
	}
	return { ok: true };
}

exports.changePassword = asyncHandler(async (req, res, next) => {
	const { password, currentPassword } = req.body;

	const check = await verifyCurrentPassword(req.user._id, currentPassword);
	if (check.error) {
		return res.status(check.error.status).json({ msg: check.error.msg });
	}

	const hashedPassword = await bcrypt.hash(password, 10);
	await User.findByIdAndUpdate(req.user._id, {
		password: hashedPassword,
	});
	res.status(201).json({ msg: "Senha atualizada com sucesso" });
});
exports.changeEmail = asyncHandler(async (req, res, next) => {
	const email = req.body.email.toLowerCase().trim();

	const check = await verifyCurrentPassword(req.user._id, req.body.currentPassword);
	if (check.error) {
		return res.status(check.error.status).json({ msg: check.error.msg });
	}

	const user = await User.findOne({ email });
	if (user) {
		return res.status(409).json({ msg: "Email já está em uso" });
	}
	try {
		await User.findByIdAndUpdate(req.user._id, { email });
	} catch (err) {
		if (err.code === 11000) {
			return res.status(409).json({ msg: "Email já está em uso" });
		}
		throw err;
	}
	res.status(201).json({ msg: "Email atualizado com sucesso" });
});

exports.allowAdultContent = asyncHandler(async (req, res, next) => {
	const allow = req.body.allow === true;
	await User.findByIdAndUpdate(req.user._id, {
		allowAdult: allow,
		...(allow ? { allowedAdultAt: new Date() } : {}),
	});
	res.status(201).json({ msg: "Atualizado com sucesso" });
});
