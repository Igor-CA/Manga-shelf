require("dotenv").config();
const path = require("path");

const nodemailer = require("nodemailer");
const ejs = require("ejs");
const logger = require("./logger");

const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_HOST,
	port: 465,
	secure: true, // Use SSL
	auth: {
		user: process.env.EMAIL,
		pass: process.env.APP_PASSWORD,
	},
	pool: true,
	maxConnections: 1,
	maxMessages: 50,
	rateDelta: 1000,
	rateLimit: 5,
});

const TRANSIENT_ERROR_CODES = ["ECONNECTION", "ETIMEDOUT", "ESOCKET", "EDNS"];
const MAX_SEND_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [1000, 3000];

function classifySmtpError(err) {
	if (
		typeof err.responseCode === "number" &&
		err.responseCode >= 400 &&
		err.responseCode <= 499
	) {
		return "transient";
	}
	if (TRANSIENT_ERROR_CODES.includes(err.code)) {
		return "transient";
	}
	return "permanent";
}

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendEmail(to, subject, template, data, attachments) {
	const emailTo =
		process.env.NODE_ENV === "production" ? to : process.env.EMAIL;

	const html = await ejs.renderFile(
		path.join(__dirname, "..", "views", `${template}.ejs`),
		data,
		{ async: true },
	);

	const mailOptions = {
		from: `Manga Shelf<${process.env.EMAIL}>`,
		to: emailTo,
		subject,
		html,
		attachments,
	};

	for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt++) {
		try {
			await transporter.sendMail(mailOptions);
			return;
		} catch (err) {
			err.classification = classifySmtpError(err);
			const isLastAttempt = attempt === MAX_SEND_ATTEMPTS;

			if (err.classification === "permanent" || isLastAttempt) {
				logger.error("Error sending email: ", err);
				throw err;
			}

			logger.warn(
				`Transient email send failure (attempt ${attempt}/${MAX_SEND_ATTEMPTS}), retrying: ${err.message}`,
			);
			await delay(RETRY_DELAYS_MS[attempt - 1]);
		}
	}
}
module.exports = { sendEmail };
