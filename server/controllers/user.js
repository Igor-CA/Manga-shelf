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
const path = require("path");

const multer = require("multer");
const { sendNewFollowerNotification } = require("./notifications");
const { sendEmail } = require("../Utils/sendEmail");
function configureMulter(folder, getFilename) {
	const storage = multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, path.resolve(folder));
		},
		filename: function (req, file, cb) {
			const filename = getFilename(req, file);
			cb(null, filename);
		},
	});

	return multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
}
const profilePictureUploader = configureMulter(
	"public/images/avatar",
	(req, file) => {
		const userId = req.user._id;
		const fileExtension = file.originalname.split(".").pop();
		return `${userId}.${fileExtension}`;
	}
);
const profileBannerUploader = configureMulter(
	"public/images/banner",
	(req, file) => {
		const userId = req.user._id;
		const fileExtension = file.originalname.split(".").pop();
		return `${userId}.${fileExtension}`;
	}
);

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
			const emailTo =
				process.env.NODE_ENV === "production" ? user.email : process.env.EMAIL;

			sendEmail(emailTo, "Mudança de senha", "forgotEmail", {
				username: user.username,
				link: `${process.env.HOST_ORIGIN}/reset/${urlCode}`,
			})
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
			const notificationCount = user.notifications?.reduce(
				(count, currentNotification) => {
					if (!currentNotification.seen) return count + 1;
					return count;
				},
				0
			);

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
				notificationCount,
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
		const pipeline = [
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
		];
		const allowAdult = req.user?.allowAdult || false;

		if (!allowAdult) {
			pipeline.push({ $match: { "userList.Series.isAdult": false } });
		}
		pipeline.push(
			{ $unwind: "$userList.Series" },
			{ $addFields: { volumesLength: { $size: "$userList.Series.volumes" } } },
			{ $match: filter },
			{ $sort: sortStage },
			{
				$project: {
					_id: "$userList.Series._id",
					title: "$userList.Series.title",
					completionPercentage: "$userList.completionPercentage",
					isAdult: "$userList.Series.isAdult",
				},
			},
			{ $skip: skip },
			{ $limit: ITEMS_PER_PAGE }
		);
		const user = await User.aggregate(pipeline);
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
	profilePictureUploader.single("file"),
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
exports.changeProfileBanner = [
	profileBannerUploader.single("file"),
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
		user.profileBannerUrl = `/images/banner/${req.file.filename}`;
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
		{ profileImageUrl: 1, username: 1, profileBannerUrl: 1 }
	);
	const following = req.user?.following.includes(user._id);
	const userInfo = { ...user._doc, following };
	if (!user) return res.status(400).json({ msg: "User not found" });

	res.send(userInfo);
});
exports.searchUser = asyncHandler(async (req, res, next) => {
	if (
		req.headers.authorization !== process.env.API_KEY &&
		process.env.NODE_ENV === "production"
	) {
		res.status(401).json({ msg: "Not authorized" });
		return;
	}
	const regex = new RegExp(req.query.q, "i");
	const page = parseInt(req.query.p) || 1;
	const users_per_page = 12;
	const skip = users_per_page * (page - 1);
	const user = await User.aggregate([
		{ $match: { username: regex } },
		{
			$addFields: {
				followersCount: { $size: { $ifNull: ["$followers", []] } },
			},
		},
		{ $sort: { followersCount: -1, username: 1 } },
		{ $skip: skip },
		{ $limit: users_per_page },
	]).collation({ locale: "en", strength: 2 });
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

exports.followUser = asyncHandler(async (req, res, next) => {
	if (
		req.headers.authorization !== process.env.API_KEY &&
		process.env.NODE_ENV === "production"
	) {
		res.status(401).json({ msg: "Not authorized" });
		return;
	}

	if (!req.isAuthenticated()) {
		res.status(400).json({ msg: "User not authenticated" });
		return;
	}

	const userId = req.user._id;
	const targetUserName = req.body.targetUser;
	//console.log({ userId, targetUserName });

	if (!targetUserName) {
		return res.status(400).json({ msg: "No user selected" });
	}
	const user = await User.findById(userId);
	const targetUser = await User.findOne({ username: targetUserName });

	//console.log({ user, targetUser });
	if (!targetUser) {
		res.send({ msg: "No user selected" });
		return;
	}
	if (!user) {
		res.status(400).json({ msg: "User not found" });
		return;
	}
	if (user._id.toString() === targetUser._id.toString()) {
		res.status(400).json({ msg: "Can't follow yourself" });
		return;
	}
	if (!user.following.includes(targetUser._id)) {
		user.following.push(targetUser._id);
	}
	if (!targetUser.followers.includes(userId)) {
		targetUser.followers.push(userId);
	}
	user.save();
	targetUser.save();

	sendNewFollowerNotification(user._id, targetUser._id);
	res.send({ msg: "Followed Successfuly" });
});
exports.unfollowUser = asyncHandler(async (req, res, next) => {
	if (
		req.headers.authorization !== process.env.API_KEY &&
		process.env.NODE_ENV === "production"
	) {
		res.status(401).json({ msg: "Not authorized" });
		return;
	}

	if (!req.isAuthenticated()) {
		res.status(400).json({ msg: "User not authenticated" });
		return;
	}

	const userId = req.user._id;
	const targetUserName = req.body.targetUser;
	//console.log({ userId, targetUserName });

	if (!targetUserName) {
		return res.status(400).json({ msg: "No user selected" });
	}
	const user = await User.findById(userId);
	const targetUser = await User.findOne({ username: targetUserName });

	//console.log({ user, targetUser });
	if (!targetUser) {
		res.send({ msg: "No user selected" });
		return;
	}
	if (!user) {
		res.status(400).json({ msg: "User not found" });
		return;
	}

	if (user.following.includes(targetUser._id)) {
		const elementToRemove = targetUser._id.toString();
		user.following = user.following.filter(
			(el) => el.toString() !== elementToRemove
		);
	}
	if (targetUser.followers.includes(user._id)) {
		const elementToRemove = user._id.toString();
		targetUser.followers = targetUser.followers.filter(
			(el) => el.toString() !== elementToRemove
		);
	}
	user.save();
	targetUser.save();
	res.send({ msg: "Unfollowed Successfuly" });
});

exports.getFollowing = asyncHandler(async (req, res, next) => {
	if (
		req.headers.authorization !== process.env.API_KEY &&
		process.env.NODE_ENV === "production"
	) {
		res.status(401).json({ msg: "Not authorized" });
		return;
	}
	const username = req.params.username;
	const result = await User.findOne({ username }, { following: 1 }).populate(
		"following",
		{ _id: 1, username: 1, profileImageUrl: 1, profileBannerUrl: 1 }
	);
	res.send(result.following);
});

exports.getFollowers = asyncHandler(async (req, res, next) => {
	if (
		req.headers.authorization !== process.env.API_KEY &&
		process.env.NODE_ENV === "production"
	) {
		res.status(401).json({ msg: "Not authorized" });
		return;
	}
	const username = req.params.username;
	const result = await User.findOne({ username }, { followers: 1 }).populate(
		"followers",
		{ _id: 1, username: 1, profileImageUrl: 1, profileBannerUrl: 1 }
	);
	res.send(result.followers);
});

exports.setUserNotifications = asyncHandler(async (req, res, next) => {
	if (
		req.headers.authorization !== process.env.API_KEY &&
		process.env.NODE_ENV === "production"
	) {
		return res.status(401).json({ msg: "Not authorized" });
	}
	if (!req.isAuthenticated()) {
		return res.status(401).json({ msg: "Usuário deve estar logado" });
	}
	const user = await User.findById(req.user._id);

	user.settings.notifications = {
		allow: req.body.enable === "on",
		volumes: req.body.volumes === "on",
		followers: req.body.followers === "on",
		updates: req.body.updates === "on",
		email: req.body["email-notification"] === "on",
		site: req.body["site-notification"] === "on",
	};

	user.save();
	res.send({ msg: "Atualizado com sucesso" });
});

exports.changeUsername = [
	body("username")
		.trim()
		.notEmpty()
		.withMessage("User name must be specified.")
		.matches(/^[A-Za-z0-9]{3,16}$/)
		.withMessage(
			"The username must be alphanumeric and between 3 and 16 characters."
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

		if (!req.isAuthenticated()) {
			return res.status(401).json({ msg: "Usuário deve estar logado" });
		}

		const { username } = req.body;

		const user = await User.findOne({ username });

		if (user) {
			return res
				.status(409)
				.json({ message: "Nome de usuário já esta em uso" });
		}

		await User.findByIdAndUpdate(req.user._id, {
			username: req.body.username,
		});

		res.status(201).json({ message: "Nome atualizado com sucesso" });
	}),
];

exports.changePassword = [
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
		if (!req.isAuthenticated()) {
			return res.status(401).json({ msg: "Usuário deve estar logado" });
		}

		const { password, ["confirm-password"]: confirmPassword } = req.body;

		if (password !== confirmPassword) {
			return res.status(409).json({ message: "Senhas não combinam" });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		await User.findByIdAndUpdate(req.user._id, {
			password: hashedPassword,
		});
		res.status(201).json({ message: "Senha atualizada com sucesso" });
	}),
];

exports.changeEmail = [
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
		if (!req.isAuthenticated()) {
			return res.status(401).json({ msg: "Usuário deve estar logado" });
		}
		const { email } = req.body;

		const user = await User.findOne({ email });

		if (user) {
			return res.status(409).json({ message: "Email já está em uso" });
		}
		await User.findByIdAndUpdate(req.user._id, {
			email,
		});
		res.status(201).json({ message: "Email atualizado com sucesso" });
	}),
];

exports.allowAdultContent = asyncHandler(async (req, res, next) => {
	if (
		req.headers.authorization !== process.env.API_KEY &&
		process.env.NODE_ENV === "production"
	) {
		res.status(401).json({ msg: "Not authorized" });
		return;
	}
	if (!req.isAuthenticated()) {
		return res.status(401).json({ msg: "Usuário deve estar logado" });
	}
	if (!req.body.allow) {
		await User.findByIdAndUpdate(req.user._id, {
			allowAdult: false,
		});
	}
	await User.findByIdAndUpdate(req.user._id, {
		allowAdult: req.body.allow,
		allowedAdultAt: new Date(),
	});
	res.status(201).json({ message: "Atualizado com sucesso" });
});
