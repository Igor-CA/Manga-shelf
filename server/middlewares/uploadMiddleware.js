const multer = require("multer");
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
	const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

	if (allowedTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(
			new Error(
				"Formato de arquivo inválido. Apenas JPG, PNG e WebP são permitidos.",
			),
			false,
		);
	}
};
const upload = multer({
	storage: storage,
	limits: {
		fileSize: 5 * 1024 * 1024,
	},
	fileFilter: fileFilter,
});

module.exports = upload;
