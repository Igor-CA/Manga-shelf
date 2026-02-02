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
});

async function sendEmail(to, subject, template, data, attachments) {
	const emailTo =
		process.env.NODE_ENV === "production" ? to : process.env.EMAIL;
	try {
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

		await transporter.sendMail(mailOptions);
	} catch (err) {
		logger.error("Error: ", err);
		throw err;
	}
}
module.exports = { sendEmail };
