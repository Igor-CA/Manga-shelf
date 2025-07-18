require("dotenv").config();
const mongoose = require("mongoose");

const { dispatchEmails } = require("./jobs/emailDispatcher");
const {
	syncAndRecalculateData,
} = require("./jobs/dataSyncRoutine");
const { backupDatabase } = require("./jobs/backupRoutine");

const mongoDB = process.env.MONGODB_TEST_URI;

mongoose
	.connect(mongoDB)
	.then(async () => {
		console.log("✅ Test script connected to database.");
		try {
			await backupDatabase();
		} catch (error) {
			console.error("An error occurred during the dispatchEmails job:", error);
		} finally {
			console.log("Job finished. Closing database connection...");
			await mongoose.connection.close();
		}
	})
	.catch((err) => {
		console.log("Worker DB connection error:", err);
		process.exit(1); // Exit if the initial connection fails
	});
