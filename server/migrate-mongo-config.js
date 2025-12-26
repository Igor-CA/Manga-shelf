require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const mongoUri = isProduction
	? process.env.MONGODB_URI
	: process.env.MONGODB_TEST_URI;

if (!mongoUri) {
	throw new Error(
		`No MongoDB URI found for environment: ${process.env.NODE_ENV}`
	);
}

function getDbNameFromUrl(url) {
	try {
		const uriPart = url.split("?")[0];
		const parts = uriPart.split("/");
		const dbName = parts[parts.length - 1];

		return dbName || null;
	} catch (e) {
		return null;
	}
}

const derivedDbName = getDbNameFromUrl(mongoUri);

if (!derivedDbName) {
	throw new Error(
		"Could not extract database name from URI. Please ensure URI ends with /your_db_name"
	);
}

const config = {
	mongodb: {
		url: mongoUri,
		databaseName: derivedDbName,

		options: {},
	},
	migrationsDir: "migrations",
	changelogCollectionName: "changelog",
	lockCollectionName: "changelog",
	lockTtl: 0,
	migrationFileExtension: ".js",
	useFileHash: false,
	moduleSystem: "commonjs",
};

module.exports = config;
