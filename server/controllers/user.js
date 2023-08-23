const User = require("../models/User");
const Series = require("../models/Series");
const {getVolumeCoverURL} = require("../Utils/getCoverFunctions")
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");

exports.signup = [
	body("username")
		.trim()
		.notEmpty()
		.withMessage("User name must be specified.")
		.escape(),
	body("password")
		.trim()
		.notEmpty()
		.withMessage("Password must be specified.")
		.escape(),
	body("confirm-password")
		.trim()
		.notEmpty()
		.withMessage("Password must be specified.")
		.escape(),
	body("email")
		.trim()
		.notEmpty()
		.withMessage("Email must be specified.")
		.escape(),

	asyncHandler(async (req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { username, password, email, ['confirm-password']: confirmPassword } = req.body;

		if (password !== confirmPassword) {
			return res.status(409).json({ message: "Passwords don't match properly" });
		} 

		const [existingUser] = await User.find()
			.or([{ username }, { email }])
			.limit(1);
		
		if (existingUser) {
			return res.status(409).json({ message: "Email or username is already in use" });
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
		const [user] = await User.find()
			.or([{ username: req.body.login }, { email: req.body.login }])
			.limit(1);
		if (!user) {
			res.send({ msg: "No user exists" });
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
			res.send({ msg: "Incorrect password" });
		}
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
		res.send({ msg: "User not found" });
	}
});

exports.removeSeries = asyncHandler(async (req, res, next) => {
	const user = await fetchUser(req); 

	if (user) {
		const newList = user.userList.filter((seriesObject) => {
			return seriesObject.Series.toString() !== req.body.id;
		});
		user.userList = newList;
		user.save();
		res.send({ msg: "Series successfully removed" });
	} else {
		res.send({ msg: "User not found" });
	}
});

exports.getProfilePage = asyncHandler(async (req, res, next) => {
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
		res.send();
	}
});

exports.getMissingPage = asyncHandler(async (req, res, next) => {
	if (req.user) {
		const user = await User.findById(req.user._id)
			.populate({
				path: "userList.Series",
				select: "title volumes",
				populate:{
					path: "volumes",
					select: "number"
				}
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
				return volumesWithImages
			})
			res.send(mangaList);
		} else {
			res.send({ msg: "User not found" });
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
				userList: { $elemMatch: { Series: req.body.seriesId } },
			}
		).populate("userList.Series");
		if (user) {
			user.ownedVolumes.push(req.body._id);
			user.userList[0].completionPercentage = req.body.completePorcentage;
			user.save();
			res.send({ msg: "Volume successfully added", user: req.user });
		} else {
			res.send({ msg: "User not found" });
		}
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
		console.log(user.ownedVolumes);
		if (user) {
			console.log("Previous List", user.ownedVolumes);
			console.log("Removed Id", req.body._id);
			const newList = user.ownedVolumes.filter((volumeId) => {
				return volumeId.toString() !== req.body._id;
			});
			user.ownedVolumes = newList;
			user.userList[0].completionPercentage = req.body.completePorcentage;
			user.save();
			res.send({ msg: "Volume successfully removed" });
		} else {
			res.send({ msg: "User not found" });
		}
	}
});
