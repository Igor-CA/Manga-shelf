const path = require("path");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const Series = require("../models/Series");
const Volume = require("../models/volume");
const Post = require("../models/Post");
const User = require("../models/User");

const byId = (Model) => (value) =>
	mongoose.Types.ObjectId.isValid(value) ? Model.exists({ _id: value }) : false;

const targets = [
	{ paths: ["/series/:key", "/series/:key/*"], exists: byId(Series) },
	{ paths: ["/volume/:key", "/volume/:key/*"], exists: byId(Volume) },
	{ paths: ["/post/:key"], exists: byId(Post) },
	{
		paths: ["/user/:key", "/user/:key/*"],
		exists: (value) => User.exists({ username: value }),
	},
];

function mountSpaFallback(app, indexPath) {
	for (const { paths, exists } of targets) {
		app.get(
			paths,
			asyncHandler(async (req, res) => {
				let found = true;
				try {
					found = Boolean(await exists(req.params.key));
				} catch (error) {
					found = true;
				}
				res.status(found ? 200 : 404).sendFile(indexPath);
			}),
		);
	}

	app.get("*", (req, res, next) => {
		if (req.path.startsWith("/api") || req.path.startsWith("/admin")) return next();
		if (path.extname(req.path)) return next();
		res.sendFile(indexPath);
	});
}

module.exports = mountSpaFallback;
