// Job for handling data consistency like userList series status, completion percentage and series Popularity
// Mainly made for updating from older database schema to newer ones and handle userList data whenever a new volume is added
const mongoose = require("mongoose");
const User = require("../models/User");
const Series = require("../models/Series");
const {
	getNewUserSeriesStatus,
} = require("../controllers/user/userActionsController");
async function syncAndRecalculateData() {
	await cleanUserDuplicates();
	await recalculateUserListInfo();
	await updateSeriesPopularity();
}

async function cleanUserDuplicates() {
	console.log("[INFO] Cleaning duplicate data");
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
				await user.save();
				usersModified++;
			}

			usersProcessed++;
		}

		console.log(
			`[INFO] Processed: ${usersProcessed}, Modified: ${usersModified}.`
		);
		return { usersProcessed, usersModified };
	} catch (error) {
		console.error("[ERROR] Error cleaning duplicate data:", error);
		throw error;
	}
}
async function recalculateUserListInfo() {
	console.log("[INFO] Checking userList related info");
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
			const seriesDocs = await Series.find({ _id: { $in: seriesIds } }).select(
				"volumes status"
			);

			const seriesMap = new Map(
				seriesDocs.map((s) => [
					s._id.toString(),
					{ volumes: s.volumes, status: s.status },
				])
			);
			user.userList.forEach((listItem) => {
				const seriesData = seriesMap.get(listItem.Series.toString());
				const seriesStatus = seriesData.status;
				const totalVolumes = seriesData.volumes || [];
				const totalCount = totalVolumes.length;
				let newPercentage = 0;

				if (totalCount > 0) {
					const ownedCount = totalVolumes.filter((volId) =>
						ownedVolumesSet.has(volId.toString())
					).length;
					newPercentage = ownedCount / totalCount;
				}
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
				await user.save();
				usersModified++;
			}

			usersProcessed++;
		}

		console.log(
			`[INFO] Checking userList related info`
		);
		return { usersProcessed, usersModified };
	} catch (error) {
		console.error("[ERROR] Error hecking userList related info:", error);
		throw error;
	}
}

async function updateSeriesPopularity() {
	console.log("[INFO] Calculating series popularity");
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

	console.log("[INFO] Series popularity updated");
	await Series.bulkWrite(bulkOps);
}

module.exports = { syncAndRecalculateData };
