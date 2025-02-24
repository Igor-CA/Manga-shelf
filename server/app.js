require("dotenv").config();
const path = require("path");

const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");

const passport = require("passport");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bodyParser = require("body-parser");
const createError = require("http-errors");

const adminRouter = require("./routes/admin");
const apiRouter = require("./routes/api");
const userRouter = require("./routes/user");

const app = express();

//Middle ware for API Key
const apiKeyAuth = (req, res, next) => {
	if (
		req.headers.authorization !== process.env.API_KEY &&
		process.env.NODE_ENV === "production"
	) {
		return res.status(401).json({ msg: "Not authorized" });
	}
	next();
};


const mongoDB = process.env.MONGODB_URI;
mongoose
	.connect(mongoDB)
	.then(() => {
		console.log("mongoose is conncected");
	})
	.catch((err) => console.log(err));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.set("trust proxy", 1);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
	cors({
		origin: process.env.CLIENT_HOST_ORIGIN,
		credentials: true,
	})
);
app.use(
	session({
		secret: process.env.SECRET_KEY,
		resave: true,
		saveUninitialized: true,
		store: MongoStore.create({
			mongoUrl: mongoDB,
			collection: "sessions",
			ttl: 15 * 24 * 60 * 60,
			autoRemove: "native",
		}),
		cookie: {
			maxAge: 15 * 24 * 60 * 60 * 1000,
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
		},
	})
);
app.use(cookieParser(process.env.SECRET_KEY));
app.use(passport.initialize());
app.use(passport.session());
require("./passport-config")(passport);

app.use(express.static(path.resolve(__dirname, "public")));

app.use("/api/user", apiKeyAuth, userRouter);
app.use("/admin", apiKeyAuth, adminRouter);
app.use("/api/data", apiKeyAuth, apiRouter);

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "../client/dist")));

	app.get("*", (req, res) =>
		res.sendFile(path.resolve(__dirname, "../", "client", "dist", "index.html"))
	);
} else {
	app.get("/", (req, res) => res.send("Please set to production"));
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});
// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get("env") === "development" ? err : {};
	// render the error page
	res.status(err.status || 500);
	res.render("error");
});

module.exports = app;
