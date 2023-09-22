const User = require("../models/User");
const Series = require("../models/Series");
const { getVolumeCoverURL } = require("../Utils/getCoverFunctions");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { body, validationResult } = require("express-validator");

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
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ message: errors.array() });
		}

		const {
			username,
			password,
			email,
			["confirm-password"]: confirmPassword,
		} = req.body;

		if (password !== confirmPassword) {
			return res
				.status(409)
				.json({ message: "Passwords don't match properly" });
		}

		const [existingUser] = await User.find()
			.or([{ username }, { email }])
			.limit(1);

		if (existingUser) {
			return res
				.status(409)
				.json({ message: "Email or username is already in use" });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = new User({
			username,
			password: hashedPassword,
			email,
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
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ message: errors.array() });
		}

		const [user] = await User.find()
			.or([{ username: req.body.login }, { email: req.body.login }])
			.limit(1);
		if (!user) {
			res
				.status(401)
				.json({ message: "User or password are incorrect try again" });
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
			res
				.status(401)
				.json({ message: "User or password are incorrect try again" });
		}
	}),
];

exports.logout = (req, res, next) => {
	req.logout(function (err) {
		if (err) {
			return next(err);
		}
		res.send({msg:"Successfully logout"});
	});
}
exports.sendResetEmail = [
	body("email")
		.trim()
		.notEmpty()
		.withMessage("Email must be specified.")
		.isEmail()
		.withMessage("Invalid email format.")
		.escape(),

	asyncHandler(async (req, res, next) => {
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
		res
			.status(401)
			.json({ message: "No user with this email" });
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
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ message: errors.array() });
		}

		const currentTimeStamp = new Date();
		const user = await User.findOne({ _id: req.body.userId });
		if (!user) {
			res.status(400).json({message:"Error: this user does not exist"});
			return;
		}

		if (user.token !== req.body.token) {
			res.status(400).json({message: "Error: Invalid token"});
			return;
		}

		if (currentTimeStamp < user.timestamp) {
			res.status(400).json({message: "Error: Token Expired"});
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
			res.status(400).json({ msg: "User not found" });
		}
	} else {
		res.status(400).json({ msg: "No user logged" });
	}
});

exports.getUserCollection = asyncHandler(async (req, res, next) => {
	const targetUser = req.params.username;
	if (targetUser) {
		const user = await User.findOne({ username: targetUser })
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
			res.status(400).json({ msg: "User not found" });
		}
	} else {
		res.send();
	}
});

exports.getMissingPage = asyncHandler(async (req, res, next) => {
	const targetUser = req.params.username;
	if (targetUser) {
		const user = await User.findOne(
			{ username: targetUser },
			"userList ownedVolumes"
		)
			.populate({
				path: "userList.Series",
				select: "title volumes",
				populate: {
					path: "volumes",
					select: "number",
				},
			})
			.exec();
		if (user) {
			const mangaList = user.userList.flatMap((seriesObj) => {
				const volumesWithImages = seriesObj.Series.volumes.map((volume) => ({
					series: seriesObj.Series.title,
					volumeId: volume._id,
					volumeNumber: volume.number,
					image: getVolumeCoverURL(seriesObj.Series, volume.number),
				}));
				return volumesWithImages;
			});
			const missingVolumesList = mangaList.filter((volume) => {
				return !user.ownedVolumes.includes(volume.volumeId);
			}).sort((volumeOne, volumeTwo) => {
				if (volumeOne.series < volumeTwo.series) return -1;
				if (volumeOne.series > volumeTwo.series) return 1;
				return volumeOne.volumeNumber - volumeTwo.volumeNumber;
			  });

			res.send(missingVolumesList);
		} else {
			res.status(400).json({ msg: "User not found" });
		}
	} else {
		res.send();
	}
});

exports.addVolume = asyncHandler(async (req, res, next) => {
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
	}else{
		res.send({ msg: "User need to be authenticated" });
	}
});

exports.removeVolume = asyncHandler(async (req, res, next) => {
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
	}
	else{
		res.send({ msg: "User need to be authenticated" });
	}
});
