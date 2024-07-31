const User = require("./models/User");
const bcrypt = require("bcrypt");
const localStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const asyncHandler = require("express-async-handler");
module.exports = function (passport) {
	passport.use(
		new GoogleStrategy(
			{
				clientID: process.env.OAUTH_CLIENT_ID,
				clientSecret: process.env.OAUTH_KEY,
				callbackURL: process.env.CALLBACK_URL,
				scope: ["profile", "email"],
			},
			asyncHandler(async (accessToken, refreshToken, profile, done) => {
				try {
					const user = await User.findOne({
						email: profile._json.email,
					});
					if (!user) {
						const newUser = new User({
							email: profile._json.email,
							username: profile._json.name,
						});
						await newUser.save();
						return done(null, newUser);
					}
					return done(null, user);
				} catch (err) {
					return done(err);
				}
			})
		)
	);

	passport.use(
		new localStrategy(
			asyncHandler(async (username, password, done) => {
				const user = await User.findOne({ username: username });
				if (!user) return done(null, false);

				bcrypt.compare(password, user.password, (err, res) => {
					if (res) {
						return done(null, user);
					} else {
						return done(null, false, {
							message: "Incorrect password",
						});
					}
				});
			})
		)
	);

	passport.serializeUser(function (user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(
		asyncHandler(async (id, done) => {
			const user = await User.findById(id);
			const userInfo = {
				_id: user._id,
				username: user.username,
			};
			done(null, userInfo);
		})
	);
};
