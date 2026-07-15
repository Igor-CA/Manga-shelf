const rateLimit = require("express-rate-limit");

const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_LIMIT = 10;

const createAuthLimiter = () =>
	rateLimit({
		windowMs: AUTH_WINDOW_MS,
		limit: AUTH_LIMIT,
		standardHeaders: true,
		legacyHeaders: false,
		message: {
			msg: "Muitas tentativas. Tente novamente em alguns minutos.",
		},
	});

module.exports = { createAuthLimiter };
