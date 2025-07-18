const { spawn } = require("child_process");
const path = require("path");
const logger = require("../Utils/logger");

const MONGO_URI = process.env.MONGODB_URI || "DBURL";
const DB_NAME = process.env.MONGODB_NAME || "dev";
function backupDatabase() {
	return new Promise((resolve, reject) => {
		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, "0");
		const day = String(today.getDate()).padStart(2, "0");
		const dateString = `${month}-${day}-${year}`;

		const backupPath = path.join(
			__dirname,
			"..",
			"..",
			"Backups",
			String(year),
			dateString
		);

		const mongodump = spawn("mongodump", [
			`--uri=${MONGO_URI}`,
			`--db=${DB_NAME}`,
			`--out=${backupPath}`,
		]);

		mongodump.stdout.on("data", (data) => {
			logger.info(`mongodump stdout: ${data}`);
		});

		mongodump.stderr.on("data", (data) => {
			logger.error(`mongodump stderr: ${data}`);
		});

		mongodump.on("close", (code) => {
			if (code === 0) {
				logger.info(
					`Backup completed successfully. Path: ${backupPath}`
				);
				resolve();
			} else {
				logger.error(`mongodump process exited with code ${code}`);
				reject(`mongodump process exited with code ${code}`); 
			}
		});
	});
}

module.exports = { backupDatabase };
