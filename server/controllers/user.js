const User = require("../models/User");
const Series = require("../models/Series");
const {
	getVolumeCoverURL,
	getSeriesCoverURL,
} = require("../Utils/getCoverFunctions");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { body, validationResult } = require("express-validator");
const ITEMS_PER_PAGE = 36;

const multer = require("multer");
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "public/images/avatar");
	},
	filename: function (req, file, cb) {
		const userId = req.user._id;
		const fileExtension = file.originalname.split(".").pop();
		const filename = `${userId}.${fileExtension}`;
		cb(null, filename);
	},
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

exports.signup = [
	body("username")
		.trim()
		.notEmpty()
		.withMessage("User name must be specified.")
		.matches(/^[A-Za-z0-9]{3,16}$/)
		.withMessage(
			"The username must be alphanumeric and between 3 and 16 characters."
		)
		.escape(),
	body("password")
		.trim()
		.notEmpty()
		.withMessage("Password must be specified.")
		.matches(
			/^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$/
		)
		.withMessage(
			"The password must contain at least one letter, one number, and a special character, and be between 8 and 20 characters."
		)
		.escape(),
	body("confirm-password")
		.trim()
		.notEmpty()
		.withMessage("Password must be specified.")
		.matches(
			/^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$/
		)
		.withMessage(
			"The password must contain at least one letter, one number, and a special character, and be between 8 and 20 characters."
		)
		.escape(),
	body("email")
		.trim()
		.notEmpty()
		.withMessage("Email must be specified.")
		.isEmail()
		.withMessage("Invalid email format.")
		.escape(),

	asyncHandler(async (req, res, next) => {
		if (
			req.headers.authorization !== process.env.API_KEY &&
			process.env.NODE_ENV === "production"
		) {
			res.status(401).json({ msg: "Not authorized" });
			return;
		}
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ message: errors.array() });
		}

		const {
			username,
			password,
			email,
			["confirm-password"]: confirmPassword,
			["tos-checkbox"]: tosCheckbox,
		} = req.body;

		if (password !== confirmPassword) {
			return res.status(409).json({ message: "Senhas não combinam" });
		}
		if (!tosCheckbox) {
			return res.status(409).json({
				message: "Precisa concordar com os termos de serviço",
			});
		}

		const [existingUser] = await User.find()
			.or([{ username }, { email }])
			.limit(1);

		if (existingUser) {
			return res
				.status(409)
				.json({ message: "Email ou nome de usuário já existe" });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = new User({
			username,
			password: hashedPassword,
			email,
			TOSAcceptedAt: new Date(),
		});
		await newUser.save();
		res.status(201).json({ message: "User created successfully" });
	}),
];

exports.login = [
	body("login")
		.trim()
		.notEmpty()
		.withMessage("User name or e-mail must be specified.")
		.escape(),
	body("password")
		.trim()
		.notEmpty()
		.withMessage("Password must be specified.")
		.escape(),

	asyncHandler(async (req, res, next) => {
		if (
			req.headers.authorization !== process.env.API_KEY &&
			process.env.NODE_ENV === "production"
		) {
			res.status(401).json({ msg: "Not authorized" });
			return;
		}
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ message: errors.array() });
		}

		const [user] = await User.find()
			.or([{ username: req.body.login }, { email: req.body.login }])
			.limit(1);
		if (!user) {
			res.status(401).json({
				message: "Usuário ou senha está errado, tente novamente.",
			});
			return;
		}

		const compareResult = await bcrypt.compare(
			req.body.password,
			user.password
		);
		if (compareResult) {
			req.logIn(user, (err) => {
				if (err) throw err;
				res.send({ msg: "Successfully authenticated" });
			});
		} else {
			res.status(401).json({
				message: "Usuário ou senha está errado, tente novamente.",
			});
		}
	}),
];

exports.logout = (req, res, next) => {
	if (
		req.headers.authorization !== process.env.API_KEY &&
		process.env.NODE_ENV === "production"
	) {
		res.status(401).json({ msg: "Not authorized" });
		return;
	}
	req.logout(function (err) {
		if (err) {
			return next(err);
		}
		res.send({ msg: "Successfully logout" });
	});
};
exports.sendResetEmail = [
	body("email")
		.trim()
		.notEmpty()
		.withMessage("Email must be specified.")
		.isEmail()
		.withMessage("Invalid email format.")
		.escape(),

	asyncHandler(async (req, res, next) => {
		if (
			req.headers.authorization !== process.env.API_KEY &&
			process.env.NODE_ENV === "production"
		) {
			res.status(401).json({ msg: "Not authorized" });
			return;
		}
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ message: errors.array() });
		}

		const user = await User.findOne({ email: req.body.email });
		if (user) {
			const tokenLength = 32;
			const token = crypto.randomBytes(tokenLength).toString("hex");
			const urlCode = `${user._id}/${token}`;

			const timestamp = new Date();
			timestamp.setMinutes(timestamp.getMinutes() + 15);

			user.tokenTimestamp = timestamp;
			user.token = token;
			user.save();

			const transporter = nodemailer.createTransport({
				service: "gmail",
				auth: {
					user: process.env.EMAIL,
					pass: process.env.APP_PASSWORD,
				},
			});
			const mailOptions = {
				from: `Change your manga shelf password accout<${process.env.EMAIL}>`,
				to: user.email,
				subject: "Change your password",
				text: `${process.env.CLIENT_HOST_ORIGIN}/reset/${urlCode}`,
				html: `<a href="${process.env.CLIENT_HOST_ORIGIN}/reset/${urlCode}">Click here to change your password</a>`,
			};

			transporter
				.sendMail(mailOptions)
				.then(() => res.send({ msg: "Email sent" }))
				.catch((error) => res.send(error));

			return;
		}
		res.status(401).json({ message: "No user with this email" });
	}),
];

exports.resetPassword = [
	body("password")
		.trim()
		.notEmpty()
		.withMessage("Password must be specified.")
		.matches(
			/^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$/
		)
		.withMessage(
			"The password must contain at least one letter, one number, and a special character, and be between 8 and 20 characters."
		)
		.escape(),
	body("confirm-password")
		.trim()
		.notEmpty()
		.withMessage("Password must be specified.")
		.matches(
			/^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$/
		)
		.withMessage(
			"The password must contain at least one letter, one number, and a special character, and be between 8 and 20 characters."
		)
		.escape(),

	asyncHandler(async (req, res, next) => {
		if (
			req.headers.authorization !== process.env.API_KEY &&
			process.env.NODE_ENV === "production"
		) {
			res.status(401).json({ msg: "Not authorized" });
			return;
		}
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ message: errors.array() });
		}

		const currentTimeStamp = new Date();
		const user = await User.findOne({ _id: req.body.userId });
		if (!user) {
			res.status(400).json({
				message: "Erro: Esse usuário não existe",
			});
			return;
		}

		if (user.token !== req.body.token) {
			res.status(400).json({ message: "Error: Invalid token" });
			return;
		}

		if (currentTimeStamp < user.timestamp) {
			res.status(400).json({ message: "Error: Token Expired" });
			return;
		}

		const newHashedPassword = await bcrypt.hash(req.body.password, 10);
		user.password = newHashedPassword;
		user.token = null;
		user.save();
		res.send("Password changed successfully");
	}),
];

async function fetchUser(req) {
	if (req.isAuthenticated()) {
		const user = await User.findById(req.user._id);
		return user;
	}
	return null;
}

exports.addSeries = asyncHandler(async (req, res, next) => {
	if (
		req.headers.authorization !== process.env.API_KEY &&
		process.env.NODE_ENV === "production"
	) {
		res.status(401).json({ msg: "Not authorized" });
		return;
	}
	const user = await fetchUser(req);

	if (user) {
		const addedSeries = { Series: req.body.id };
		user.userList.push(addedSeries);
		user.save();
		res.send({ msg: "Series successfully added" });
	} else {
		res.status(400).json({ msg: "User not authenticated" });
	}
});

exports.removeSeries = asyncHandler(async (req, res, next) => {
	if (
		req.headers.authorization !== process.env.API_KEY &&
		process.env.NODE_ENV === "production"
	) {
		res.status(401).json({ msg: "Not authorized" });
		return;
	}
	const user = await User.findById(req.user._id, {
		ownedVolumes: 1,
		userList: 1,
	}).populate({
		path: "ownedVolumes",
		select: "serie",
	});
	if (user) {
		const newSeriesList = user.userList.filter((seriesObject) => {
			return seriesObject.Series.toString() !== req.body.id;
		});
		const newVolumesList = user.ownedVolumes.filter((volume) => {
			volumeSeriesId = volume.serie.toString();
			return volumeSeriesId !== req.body.id;
		});
		user.userList = newSeriesList;
		user.ownedVolumes = newVolumesList;
		user.save();
		res.send({ msg: "Series successfully removed" });
	} else {
		res.status(400).json({ msg: "User not found" });
	}
});

exports.getLoggedUser = asyncHandler(async (req, res, next) => {
	if (
		req.headers.authorization !== process.env.API_KEY &&
		process.env.NODE_ENV === "production"
	) {
		res.status(401).json({ msg: "Not authorized" });
		return;
	}
	if (req.user) {
		const user = await User.findById(req.user._id)
			.populate({
				path: "userList.Series",
				select: "title",
			})
			.exec();
		if (user) {
			const userInfo = {
				_id: user._id,
				username: user.username,
				userList: user.userList,
				ownedVolumes: user.ownedVolumes,
			};
			res.send(userInfo);
		} else {
			res.send({ msg: "User not found" });
		}
	} else {
		res.send({ msg: "No user logged" });
	}
});

exports.getUserCollection = asyncHandler(async (req, res, next) => {
	if (
		req.headers.authorization !== process.env.API_KEY &&
		process.env.NODE_ENV === "production"
	) {
		res.status(401).json({ msg: "Not authorized" });
		return;
	}
	const targetUser = req.params.username;
	if (targetUser) {
		const page = parseInt(req.query.p) || 1;
		const skip = ITEMS_PER_PAGE * (page - 1);
		const { publisher, genre } = req.query;
		const title = req.query["search-bar"];

		const filter = {};
		if (genre) filter["userList.Series.genres"] = { $in: [genre] };
		if (publisher) filter["userList.Series.publisher"] = publisher;
		if (title) {
			filter.$or = [
				{ "userList.Series.title": { $regex: title, $options: "i" } },
				{
					"userList.Series.synonyms": {
						$regex: title,
						$options: "i",
					},
				},
				{ "userList.Series.authors": { $regex: title, $options: "i" } },
			];
		}

		const sortOptions = {
			title: "userList.Series.title",
			publisher: "userList.Series.publisher",
			volumes: "volumesLength",
			status: "userList.completionPercentage",
			timestamp: "userList.timestamp",
		};
		const ordering = req.query.ordering || "title";

		const sortStage = {};
		sortStage[sortOptions[ordering]] = 1;
		sortStage["userList.Series.title"] = 1;

		const user = await User.aggregate([
			{ $match: { username: targetUser } },
			{
				$project: {
					userList: {
						$filter: {
							input: "$userList",
							as: "item",
							cond: { $ne: ["$$item.Series", null] },
						},
					},
				},
			},
			{ $unwind: "$userList" },
			{
				$lookup: {
					from: "series",
					localField: "userList.Series",
					foreignField: "_id",
					as: "userList.Series",
				},
			},
			{ $unwind: "$userList.Series" },
			{ $addFields: { volumesLength: { $size: "$userList.Series.volumes" } } },
			{ $match: filter },
			{ $sort: sortStage },
			{
				$project: {
					_id: "$userList.Series._id",
					title: "$userList.Series.title",
					completionPercentage: "$userList.completionPercentage",
				},
			},
			{ $skip: skip },
			{ $limit: ITEMS_PER_PAGE },
		]);
		if (user) {
			const filteredList = user.map((series) => {
				return {
					...series,
					image: getSeriesCoverURL(series),
				};
			});

			res.send(filteredList);
		} else {
			res.status(400).json({ msg: "User not found" });
		}
	} else {
		res.send();
	}
});

exports.getMissingPage = asyncHandler(async (req, res, next) => {
	if (
		req.headers.authorization !== process.env.API_KEY &&
		process.env.NODE_ENV === "production"
	) {
		res.status(401).json({ msg: "Not authorized" });
		return;
	}
	const targetUser = req.params.username;
	if (targetUser) {
		const page = parseInt(req.query.p) || 1;
		const skip = ITEMS_PER_PAGE * (page - 1);

		const aggregationPipeline = [
			// Match the user by username
			{ $match: { username: targetUser } },

			// Unwind userList to process individual series
			{ $unwind: "$userList" },
			// Lookup the series details
			{
				$lookup: {
					from: "series",
					localField: "userList.Series",
					foreignField: "_id",
					as: "seriesDetails",
				},
			},
			{ $unwind: "$seriesDetails" },

			// Unwind the volumes array within seriesDetails
			{ $unwind: "$seriesDetails.volumes" },

			// Lookup to get volume details
			{
				$lookup: {
					from: "volumes",
					localField: "seriesDetails.volumes",
					foreignField: "_id",
					as: "volumeDetails",
				},
			},
			{ $unwind: "$volumeDetails" },

			// Prepare the list of owned volume IDs
			{
				$addFields: {
					ownedVolumesSet: { $setUnion: ["$ownedVolumes", []] },
				},
			},

			// Add a field to indicate whether the volume is owned or not
			{
				$addFields: {
					isOwned: {
						$cond: [
							{ $in: ["$volumeDetails._id", "$ownedVolumesSet"] },
							true,
							false,
						],
					},
				},
			},

			// Filter out volumes that are owned
			{ $match: { isOwned: false } },

			// Group back the data
			{
				$group: {
					_id: "$volumeDetails._id",
					series: { $first: "$seriesDetails.title" },
					volumeId: { $first: "$volumeDetails._id" },
					volumeNumber: { $first: "$volumeDetails.number" },
				},
			},

			// Sort the results by series title and volume number
			{
				$sort: {
					series: 1,
					volumeNumber: 1,
				},
			},

			// Pagination
			{ $skip: skip },
			{ $limit: ITEMS_PER_PAGE },
		];

		const missingVolumesList = await User.aggregate(aggregationPipeline).exec();
		const listWithImages = missingVolumesList.map((volume) => {
			const seriesObject = { title: volume.series };
			return {
				...volume,
				title: volume.series,
				image: getVolumeCoverURL(seriesObject, volume.volumeNumber),
			};
		});
		res.send(listWithImages);
	} else {
		res.send();
	}
});

exports.addVolume = asyncHandler(async (req, res, next) => {
	if (
		req.headers.authorization !== process.env.API_KEY &&
		process.env.NODE_ENV === "production"
	) {
		res.status(401).json({ msg: "Not authorized" });
		return;
	}
	if (req.isAuthenticated()) {
		const user = await User.findOne(
			{ _id: req.user._id },
			{
				ownedVolumes: 1,
				userList: 1,
			}
		).populate("userList.Series");
		if (user) {
			const indexOfSeries = user.userList.findIndex((seriesObj) => {
				return seriesObj.Series._id.toString() === req.body.seriesId;
			});
			user.ownedVolumes.push(...req.body.idList);

			if (indexOfSeries === -1) {
				const completePorcentage =
					req.body.idList.length / req.body.amoutVolumesFromSeries;
				const addedSeries = {
					Series: req.body.seriesId,
					completionPercentage: completePorcentage,
				};
				user.userList.push(addedSeries);
			} else {
				const seriesList = user.userList[indexOfSeries].Series.volumes;
				const haveFromSeries = seriesList.filter((volumesId) => {
					id = volumesId.toString();
					return user.ownedVolumes.includes(id);
				});
				const completePorcentage = haveFromSeries.length / seriesList.length;

				const seriesBeingAdded = user.userList[indexOfSeries];
				seriesBeingAdded.completionPercentage = completePorcentage;
			}

			user.save();
			res.send({ msg: "Volume successfully added" });
		} else {
			res.status(400).json({ msg: "User not found" });
		}
	} else {
		res.send({ msg: "User need to be authenticated" });
	}
});

exports.removeVolume = asyncHandler(async (req, res, next) => {
	if (
		req.headers.authorization !== process.env.API_KEY &&
		process.env.NODE_ENV === "production"
	) {
		res.status(401).json({ msg: "Not authorized" });
		return;
	}
	if (req.isAuthenticated()) {
		const user = await User.findOne(
			{ _id: req.user._id },
			{
				ownedVolumes: 1,
				userList: { $elemMatch: { Series: req.body.seriesId } },
			}
		).populate("userList.Series");
		if (user) {
			const newVolumesList = user.ownedVolumes.filter((volumeId) => {
				id = volumeId.toString();
				return !req.body.idList.includes(id);
			});
			user.ownedVolumes = newVolumesList;
			const seriesList = user.userList[0].Series.volumes;
			const haveFromSeries = seriesList.filter((volumesId) => {
				id = volumesId.toString();
				return user.ownedVolumes.includes(id);
			});
			const completePorcentage = haveFromSeries.length / seriesList.length;

			user.userList[0].completionPercentage = completePorcentage;

			user.save();
			res.send({ msg: "Volume successfully removed" });
		} else {
			res.status(400).json({ msg: "User not found" });
		}
	} else {
		res.send({ msg: "User need to be authenticated" });
	}
});

exports.setUserName = [
	body("username")
		.trim()
		.notEmpty()
		.withMessage("É obrigatório informar um nome de usuário.")
		.matches(/^[A-Za-z0-9]{3,16}$/)
		.withMessage(
			"O nome de usuário não pode ter caracteres especiais (!@#$%^&*) e deve ter entre 3 e 16 caracteres."
		)
		.escape(),

	asyncHandler(async (req, res, next) => {
		if (
			req.headers.authorization !== process.env.API_KEY &&
			process.env.NODE_ENV === "production"
		) {
			return res.status(401).json({ msg: "Not authorized" });
		}
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ message: errors.array() });
		}
		if (!req.isAuthenticated()) {
			return res.status(401).json({ msg: "Usuário deve estar logado" });
		}

		const user = await User.findOne({ username: req.body.username });
		if (user) {
			return res.status(409).json({ msg: "Nome de usuário já existe" });
		}

		await User.findByIdAndUpdate(req.user._id, {
			username: req.body.username,
		});
		res.send({ msg: "Nome atualizado com sucesso" });
	}),
];
exports.changeProfilePicture = [
	upload.single("file"),
	asyncHandler(async (req, res, next) => {
		if (
			req.headers.authorization !== process.env.API_KEY &&
			process.env.NODE_ENV === "production"
		) {
			return res.status(401).json({ msg: "Not authorized" });
		}
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ message: errors.array() });
		}
		if (!req.isAuthenticated()) {
			return res.status(401).json({ msg: "Usuário deve estar logado" });
		}
		const user = await User.findById(req.user._id);
		user.profileImageUrl = `/images/avatar/${req.file.filename}`;
		await user.save();
		res.status(201).json(user);
	}),
];

exports.getUserInfo = asyncHandler(async (req, res, next) => {
	if (
		req.headers.authorization !== process.env.API_KEY &&
		process.env.NODE_ENV === "production"
	) {
		res.status(401).json({ msg: "Not authorized" });
		return;
	}
	const targetUser = req.params.username;
	if (!targetUser) return res.send({ msg: "Nenhum usuário informado" });

	const user = await User.findOne(
		{ username: targetUser },
		{ profileImageUrl: 1, username: 1 }
	);
	if (!user) return res.status(400).json({ msg: "User not found" });

	res.send(user);
});

exports.getUserStats = asyncHandler(async (req, res, next) => {
	if (
		req.headers.authorization !== process.env.API_KEY &&
		process.env.NODE_ENV === "production"
	) {
		res.status(401).json({ msg: "Not authorized" });
		return;
	}
	const targetUser = req.params.username;
	if (targetUser) {
		const genresByVolumePipeline = [
			{ $match: { username: targetUser } },
			{ $unwind: "$ownedVolumes" },
			{
				$lookup: {
					from: "volumes",
					localField: "ownedVolumes",
					foreignField: "_id",
					as: "volumeDetails",
				},
			},
			{ $unwind: "$volumeDetails" },
			{
				$lookup: {
					from: "series",
					localField: "volumeDetails.serie",
					foreignField: "_id",
					as: "seriesDetails",
				},
			},
			{ $unwind: "$seriesDetails" },
			{ $unwind: "$seriesDetails.genres" },
			{
				$group: {
					_id: "$seriesDetails.genres",
					count: { $sum: 1 },
				},
			},
			{
				$project: {
					_id: 0,
					name: "$_id",
					count: 1,
				},
			},
			{ $sort: { count: -1, name: 1 } },
		];
		const genresBySeriesPipeline = [
			{ $match: { username: targetUser } },
			{ $unwind: "$userList" },

			{
				$lookup: {
					from: "series",
					localField: "userList.Series",
					foreignField: "_id",
					as: "seriesDetails",
				},
			},
			{ $unwind: "$seriesDetails" },
			{ $unwind: "$seriesDetails.genres" },
			{
				$group: {
					_id: "$seriesDetails.genres",
					count: { $sum: 1 },
				},
			},
			{
				$project: {
					_id: 0,
					name: "$_id",
					count: 1,
				},
			},

			{ $sort: { count: -1, name: 1 } },
		];
		const publisherByVolumePipeline = [
			{ $match: { username: targetUser } },
			{ $unwind: "$ownedVolumes" },
			{
				$lookup: {
					from: "volumes",
					localField: "ownedVolumes",
					foreignField: "_id",
					as: "volumeDetails",
				},
			},
			{ $unwind: "$volumeDetails" },
			{
				$lookup: {
					from: "series",
					localField: "volumeDetails.serie",
					foreignField: "_id",
					as: "seriesDetails",
				},
			},
			{ $unwind: "$seriesDetails" },
			{ $unwind: "$seriesDetails.publisher" },
			{
				$group: {
					_id: "$seriesDetails.publisher",
					count: { $sum: 1 },
				},
			},
			{
				$project: {
					_id: 0,
					name: "$_id",
					count: 1,
				},
			},
			{ $sort: { count: -1, name: 1 } },
		];
		const publisherBySeriesPipeline = [
			{ $match: { username: targetUser } },
			{ $unwind: "$userList" },

			{
				$lookup: {
					from: "series",
					localField: "userList.Series",
					foreignField: "_id",
					as: "seriesDetails",
				},
			},
			{ $unwind: "$seriesDetails" },
			{ $unwind: "$seriesDetails.publisher" },
			{
				$group: {
					_id: "$seriesDetails.publisher",
					count: { $sum: 1 },
				},
			},
			{
				$project: {
					_id: 0,
					name: "$_id",
					count: 1,
				},
			},

			{ $sort: { count: -1, name: 1 } },
		];
		const countPipeline = [
			{ $match: { username: targetUser } },
			{
				$project: {
					ownedVolumesCount: { $size: "$ownedVolumes" },
					userListCount: { $size: "$userList" },
				},
			},
		];
		const [
			genresByVolume,
			genresBySeries,
			publisherByVolume,
			publisherBySeries,
			counts,
		] = await Promise.all([
			User.aggregate(genresByVolumePipeline).exec(),
			User.aggregate(genresBySeriesPipeline).exec(),
			User.aggregate(publisherByVolumePipeline).exec(),
			User.aggregate(publisherBySeriesPipeline).exec(),
			User.aggregate(countPipeline).exec(),
		]);

		const stats = {
			genresBySeries,
			genresByVolume,
			publisherByVolume,
			publisherBySeries,
			volumesCount: counts[0].ownedVolumesCount,
			seriesCount: counts[0].userListCount,
		};
		res.send(stats);
	} else {
		res.send();
	}
});
