const winston = require("winston");

const logLevels = {
	error: 0,
	warn: 1,
	info: 2,
	http: 3,
	debug: 4,
};

const logColors = {
	error: "red",
	warn: "yellow",
	info: "green",
	http: "magenta",
	debug: "white",
};

winston.addColors(logColors);

const logFormat = winston.format.combine(
	winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
	winston.format.colorize({ all: true }),
	winston.format.printf(
		(info) => `${info.timestamp} - [${info.level}]: ${info.message}`
	)
);

const transports = [
	new winston.transports.Console({ format: logFormat }),

	new winston.transports.File({
		filename: "logs/error.log",
		level: "error",
		format: winston.format.json(),
	}),

	new winston.transports.File({
		filename: "logs/combined.log",
		format: winston.format.json(),
	}),
];

const logger = winston.createLogger({
	level: process.env.LOG_LEVEL || "info",
	levels: logLevels,
	transports,
});

module.exports = logger;
