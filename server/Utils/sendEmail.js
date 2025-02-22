require("dotenv").config();
const path = require('path');

const nodemailer = require("nodemailer");
const ejs = require("ejs");

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL,
		pass: process.env.APP_PASSWORD,
	},
});

async function sendEmail(to, subject, template, data, attachments) {
	const emailTo =
		process.env.NODE_ENV === "production"
			? to
			: process.env.EMAIL;
	try {
		const html = await ejs.renderFile(
			path.join(__dirname, "..", "views", `${template}.ejs`),
			data,
			{ async: true }
		);

		const mailOptions = {
			from: `Manga Shelf<${process.env.EMAIL}>`,
			to:emailTo,
			subject,
			html,
			attachments
		};

		await transporter.sendMail(mailOptions);
	} catch (err) {
		console.log("Error: ", err);
		throw err;
	}
}
module.exports = { sendEmail };
