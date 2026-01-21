const CollectionPhoto = require("../models/CollectionPhoto");
const asyncHandler = require("express-async-handler");
const path = require("path");
const multer = require("multer");
const mime = require("mime-types");
const fs = require("fs");

// Configure multer for collection photos
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.resolve("public/images/collection-photos"));
	},
	filename: (req, file, cb) => {
		const userId = req.user._id;
		const timestamp = Date.now();
		const fileExtension = mime.extension(file.mimetype) || "webp";
		cb(null, `${userId}-${timestamp}.${fileExtension}`);
	},
});

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

const upload = multer({
	storage,
	limits: { fileSize: 10 * 1024 * 1024 },
	fileFilter,
});

exports.createPhoto = [
	upload.single("photo"),
	asyncHandler(async (req, res) => {
		if (!req.file) {
			return res.status(400).json({ msg: "Nenhuma foto enviada" });
		}

		const { description, date, order, isVisible, isAdultContent } = req.body;

		const photo = new CollectionPhoto({
			user: req.user._id,
			imageUrl: `/images/collection-photos/${req.file.filename}`,
			description: description || "",
			date: date || new Date(),
			order: order || 0,
			isVisible: isVisible !== undefined ? isVisible : true,
			isAdultContent: isAdultContent === "true" || isAdultContent === true,
		});

		await photo.save();
		res.status(201).json({ msg: "Foto adicionada com sucesso", photo });
	}),
];

exports.getUserPhotos = asyncHandler(async (req, res) => {
	const username = req.params.username;
	const User = require("../models/User");

	const user = await User.findOne({ username }, "_id");
	if (!user) {
		return res.status(404).json({ msg: "Usuário não encontrado" });
	}

	const query = { user: user._id };
	if (!req.user || req.user._id.toString() !== user._id.toString()) {
		query.isVisible = true;
		if (!req.user || !req.user.allowAdult) {
			query.isAdultContent = false;
		}
	}

	const photos = await CollectionPhoto.find(query)
		.sort({ date: -1, order: 1 })
		.exec();

	const photosByDate = photos.reduce((acc, photo) => {
		const dateKey = photo.date.toISOString().split("T")[0];
		if (!acc[dateKey]) {
			acc[dateKey] = [];
		}
		acc[dateKey].push(photo);
		return acc;
	}, {});

	res.json({ photosByDate, photos });
});

// Update a photo
exports.updatePhoto = asyncHandler(async (req, res) => {
	const photoId = req.params.id;
	const { description, date, order, isVisible, isAdultContent } = req.body;

	const photo = await CollectionPhoto.findById(photoId);

	if (!photo) {
		return res.status(404).json({ msg: "Foto não encontrada" });
	}

	if (photo.user.toString() !== req.user._id.toString()) {
		return res.status(403).json({ msg: "Não autorizado" });
	}

	if (description !== undefined) photo.description = description;
	if (date !== undefined) photo.date = date;
	if (order !== undefined) photo.order = order;
	if (isVisible !== undefined) photo.isVisible = isVisible;
	if (isAdultContent !== undefined) photo.isAdultContent = isAdultContent;

	await photo.save();
	res.json({ msg: "Foto atualizada com sucesso", photo });
});

exports.deletePhoto = asyncHandler(async (req, res) => {
	const photoId = req.params.id;

	const photo = await CollectionPhoto.findById(photoId);

	if (!photo) {
		return res.status(404).json({ msg: "Foto não encontrada" });
	}

	if (photo.user.toString() !== req.user._id.toString()) {
		return res.status(403).json({ msg: "Não autorizado" });
	}

	const filePath = path.resolve(`public${photo.imageUrl}`);
	if (fs.existsSync(filePath)) {
		fs.unlinkSync(filePath);
	}

	await CollectionPhoto.findByIdAndDelete(photoId);
	res.json({ msg: "Foto removida com sucesso" });
});

exports.getPhoto = asyncHandler(async (req, res) => {
	const photoId = req.params.id;

	const photo = await CollectionPhoto.findById(photoId).populate(
		"user",
		"username",
	);

	if (!photo) {
		return res.status(404).json({ msg: "Foto não encontrada" });
	}

	if (
		!photo.isVisible &&
		(!req.user || req.user._id.toString() !== photo.user._id.toString())
	) {
		return res.status(403).json({ msg: "Foto não disponível" });
	}

	res.json({ photo });
});
