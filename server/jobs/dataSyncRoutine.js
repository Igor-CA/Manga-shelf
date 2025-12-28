// Job for handling data consistency like userList series status, completion percentage and series Popularity
// Mainly made for updating from older database schema to newer ones and handle userList data whenever a new volume is added
const mongoose = require("mongoose");
const User = require("../models/User");
const Series = require("../models/Series");
const {
	getNewUserSeriesStatus,
} = require("../controllers/user/userActionsController");
const logger = require("../Utils/logger");
async function syncAndRecalculateData() {
	await cleanUserDuplicates();
	await recalculateUserListInfo();
	await updateSeriesPopularity();
}

async function cleanUserDuplicates() {
	logger.info("Cleaning duplicate data");
	let usersProcessed = 0;
	let usersModified = 0;

	const cursor = User.find({}).cursor();

	try {
		for (
			let user = await cursor.next();
			user != null;
			user = await cursor.next()
		) {
			let wasModified = false;

			const originalWishListCount = user.wishList.length;
			const uniqueWishList = [
				...new Set(user.wishList.map((id) => id.toString())),
			];

			if (uniqueWishList.length < originalWishListCount) {
				user.wishList = uniqueWishList.map(
					(id) => new mongoose.Types.ObjectId(id)
				);
				wasModified = true;
			}

			const originalOwnedVolumesCount = user.ownedVolumes.length;
			const uniqueOwnedVolumes = [
				...new Set(user.ownedVolumes.map((id) => id.toString())),
			];

			if (uniqueOwnedVolumes.length < originalOwnedVolumesCount) {
				user.ownedVolumes = uniqueOwnedVolumes.map(
					(id) => new mongoose.Types.ObjectId(id)
				);
				wasModified = true;
			}

			const originalUserListCount = user.userList.length;
			const seenSeries = new Set();
			const uniqueUserList = user.userList.filter((item) => {
				if (!item || !item.Series) return false;
				const seriesId = item.Series.toString();
				if (!seenSeries.has(seriesId)) {
					seenSeries.add(seriesId);
					return true;
				}
				return false;
			});

			if (uniqueUserList.length < originalUserListCount) {
				user.userList = uniqueUserList;
				wasModified = true;
			}

			if (wasModified) {
				logger.warn(`Cleaned user duplicate. User: ${user}`)
				await user.save();
				usersModified++;
			}

			usersProcessed++;
		}

		logger.info(`Processed: ${usersProcessed}, Modified: ${usersModified}.`);
		return { usersProcessed, usersModified };
	} catch (error) {
		logger.error("Error cleaning duplicate data:", error);
		throw error;
	}
}
async function recalculateUserListInfo() {
	logger.info("Checking userList related info");
	let usersProcessed = 0;
	let usersModified = 0;

	await User.updateMany(
		{ "userList.status": { $exists: false } },
		{ $set: { "userList.$[element].status": "Collecting" } },
		{ arrayFilters: [{ "element.status": { $exists: false } }] }
	);

	const cursor = User.find({ "userList.0": { $exists: true } }).cursor();

	try {
		for (
			let user = await cursor.next();
			user != null;
			user = await cursor.next()
		) {
			let wasModified = false;

			const ownedVolumesSet = new Set(
				user.ownedVolumes.map((id) => id.toString())
			);

			const seriesIds = user.userList.map((item) => item.Series);

			const seriesDocs = await Series.find({ _id: { $in: seriesIds } })
				.select("volumes status")
				.populate({
					path: "volumes",
					select: "number isVariant _id",
				});

			const seriesMap = new Map(
				seriesDocs.map((s) => [
					s._id.toString(),
					{ volumes: s.volumes, status: s.status },
				])
			);
			user.userList.forEach((listItem) => {
				const seriesId = listItem.Series.toString();
				if (!seriesMap.has(seriesId)) return;

				const seriesData = seriesMap.get(seriesId);
				const seriesStatus = seriesData.status;

				const allVolumes = seriesData.volumes || [];
				let newPercentage = 0;

				const standardVolumes = allVolumes.filter((v) => !v.isVariant);
				const totalStandardCount = standardVolumes.length;

				if (totalStandardCount > 0) {
					const ownedVolumeObjects = allVolumes.filter((vol) =>
						ownedVolumesSet.has(vol._id.toString())
					);

					const uniqueOwnedCount = new Set(
						ownedVolumeObjects.map((v) => v.number)
					).size;

					newPercentage = uniqueOwnedCount / totalStandardCount;
				}

				if (newPercentage > 1) newPercentage = 1;

				if (Math.abs(listItem.completionPercentage - newPercentage) > 0.001) {
					listItem.completionPercentage = newPercentage;
					wasModified = true;
				}
				let newStatus = getNewUserSeriesStatus(
					seriesStatus,
					listItem.completionPercentage
				);
				if (listItem.status != "Dropped" && newStatus != listItem.status) {
					listItem.status = newStatus;
					wasModified = true;
				}
			});

			if (wasModified) {
				logger.warn(`Userlist Recalculated. User: ${user}`)
				await user.save();
				usersModified++;
			}

			usersProcessed++;
		}

		logger.info(`Processed: ${usersProcessed}, Modified: ${usersModified}.`);
		return { usersProcessed, usersModified };
	} catch (error) {
		logger.error("Error checking userList related info:", error);
		throw error;
	}
}
async function updateSeriesPopularity() {
	try {
		logger.info("Calculating series popularity");
		const popularityAggregation = await User.aggregate([
			{
				$project: {
					allSeries: {
						$concatArrays: [
							{ $ifNull: ["$userList.Series", []] },
							{ $ifNull: ["$wishList", []] },
						],
					},
				},
			},
			{ $unwind: "$allSeries" },
			{
				$group: {
					_id: "$allSeries",
					userCount: { $addToSet: "$_id" },
				},
			},
			{
				$project: {
					popularity: { $size: "$userCount" },
				},
			},
		]);

		const bulkOps = popularityAggregation.map(({ _id, popularity }) => ({
			updateOne: {
				filter: { _id },
				update: { $set: { popularity } },
			},
		}));

		logger.info("Series popularity updated");
		await Series.bulkWrite(bulkOps);
	} catch (error) {
		logger.error("Error updating series popularity:", error);
		throw error;
	}
}

module.exports = { syncAndRecalculateData };
