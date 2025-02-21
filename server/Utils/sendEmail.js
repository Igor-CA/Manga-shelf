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
	try {
		const html = await ejs.renderFile(
			path.join(__dirname, "..", "views", `${template}.ejs`),
			data,
			{ async: true }
		);

		const mailOptions = {
			from: `Manga Shelf<${process.env.EMAIL}>`,
			to,
			subject,
			html,
			attachments
		};

		await transporter.sendMail(mailOptions);

		console.log("Message sent successfully!");
	} catch (err) {
		console.log("Error: ", err);
		throw err;
	}
}
module.exports = { sendEmail };
