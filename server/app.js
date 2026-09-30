require("dotenv").config();
const path = require("path");

const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

const passport = require("passport");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bodyParser = require("body-parser");
const createError = require("http-errors");

const adminRouter = require("./routes/admin");
const apiRouter = require("./routes/api");
const userRouter = require("./routes/user");
const logger = require("./Utils/logger");
const startScheduledJobs = require("./jobsHandler");
const mountSpaFallback = require("./middlewares/spaFallback");

const app = express();

process.on("uncaughtException", (error) => {
	logger.error("Uncaught Exception:", {
		message: error.message,
		stack: error.stack,
	});
	process.exit(1);
});

process.on("unhandledRejection", (reason) => {
	logger.error("Unhandled Rejection:", {
		reason: reason instanceof Error ? reason.message : String(reason),
		stack: reason instanceof Error ? reason.stack : undefined,
	});
});

//Middleware for API Key
const apiKeyAuth = (req, res, next) => {
	const publicRoutes = [
		"/login/auth/google",
		"/auth/google/callback",
		"/link-click",
	];
	if (publicRoutes.includes(req.path)) {
		return next();
	}
	if (
		req.headers.authorization !== process.env.API_KEY &&
		process.env.NODE_ENV === "production"
	) {
		return res.status(401).json({ msg: "Não autorizado" }); //Not authorized
	}
	next();
};
//Middleware for admin routes
const checkAdmin = (req, res, next) => {
	const user = req.user;

	if (!user) {
		return res.status(401).json({ msg: "Usuário deve estar logado" });
	}

	const isAdmin = user.isAdmin || false;

	if (!isAdmin) {
		return res
			.status(403)
			.json({ msg: "Você não tem autorização pra esse recurso" });
	}
	next();
};

const mongoDB = process.env.MONGODB_URI;
mongoose
	.connect(mongoDB)
	.then(() => {
		logger.info("mongoose is conncected");
	})
	.catch((err) => {
		logger.error("Initial MongoDB connection failed, exiting:", {
			message: err.message,
			stack: err.stack,
		});
		process.exit(1);
	});

startScheduledJobs();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.set("trust proxy", 1);

app.use(
	helmet({
		contentSecurityPolicy: false,
		crossOriginResourcePolicy: { policy: "cross-origin" },
	})
);
app.use(compression());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
	cors({
		origin: process.env.CLIENT_HOST_ORIGIN,
		credentials: true,
	})
);

for (const size of ["small", "medium", "large", "extralarge"]) {
	app.use(
		`/images/${size}`,
		express.static(path.resolve(__dirname, "public", "images", size), {
			maxAge: "7d",
		})
	);
}
app.use(express.static(path.resolve(__dirname, "public")));

if (process.env.NODE_ENV === "production") {
	app.use(
		"/assets",
		express.static(path.join(__dirname, "../client/dist/assets"), {
			maxAge: "1y",
			immutable: true,
		})
	);
	app.use(express.static(path.join(__dirname, "../client/dist")));

	mountSpaFallback(
		app,
		path.resolve(__dirname, "../", "client", "dist", "index.html")
	);
} else {
	app.get("/", (req, res) => res.send("Please set to production"));
}

app.use(
	session({
		secret: process.env.SECRET_KEY,
		resave: false,
		saveUninitialized: false,
		store: MongoStore.create({
			clientPromise: mongoose.connection
				.asPromise()
				.then((connection) => connection.getClient()),
			collection: "sessions",
			ttl: 15 * 24 * 60 * 60,
			autoRemove: "native",
		}),
		cookie: {
			maxAge: 15 * 24 * 60 * 60 * 1000,
			secure:
				process.env.COOKIE_SECURE !== undefined
					? process.env.COOKIE_SECURE === "true"
					: process.env.NODE_ENV === "production",
			httpOnly: true,
		},
	})
);
app.use(cookieParser(process.env.SECRET_KEY));
app.use(passport.initialize());
app.use(passport.session());
require("./passport-config")(passport);

app.use("/api/user", apiKeyAuth, userRouter);
app.use("/api/data", apiKeyAuth, apiRouter);
app.use("/admin", apiKeyAuth, checkAdmin, adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});
// error handler
app.use(function (err, req, res, next) {
	const status = err.status || 500;
	res.status(status);
	logger.error(`Error in API call: ${err} URL: ${req.originalUrl}`);

	if (req.path.startsWith("/api") || req.path.startsWith("/admin")) {
		return res.json({
			msg: status === 404 ? "Recurso não encontrado" : "Erro interno no servidor",
		});
	}

	res.locals.status = status;
	res.locals.error = req.app.get("env") === "development" ? err : null;
	// render the error page
	res.render("error");
});

module.exports = app;
