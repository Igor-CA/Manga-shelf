// Job for handling data consistency like userList series status, completion percentage and series Popularity
// Mainly made for updating from older database schema to newer ones and handle userList data whenever a new volume is added
const mongoose = require("mongoose");
const User = require("../models/User");
const Series = require("../models/Series");
const Rating = require("../models/Rating");
const {
	getNewUserSeriesStatus,
} = require("../controllers/user/userActionsController");
const logger = require("../Utils/logger");
const volume = require("../models/volume");
const { escapeRegex } = require("../Utils/escapeRegex");
const { success } = require("./jobResult");

const INTERNAL_RELATIONS = ["Outra Edição", "Mesmo Autor(a)"];
const FRANCHISE_LINKS = [
	"Antecedente",
	"Continuação",
	"História Principal",
	"História Paralela",
	"Versão Alternativa",
	"Spin-off",
	"Adaptação",
	"Material Original",
	"Outro",
	"Databook"
];

function calculateLocalStatus(series) {
	if (series.status === "Cancelado") return "Cancelado";
	if (!series.originalRun?.status) return series.status;

	const { status: originalStatus, totalVolumes } = series.originalRun;

	if (originalStatus === "Em andamento") return "Em andamento";
	if (!totalVolumes) return originalStatus;

	const equivalentVolumes = (series.volumes?.length || 0) * (series.specs?.volumesInFormat || 1);
	if (equivalentVolumes >= totalVolumes) return originalStatus;

	logger.warn(`[${series.title}] Incomplete collection: Local = ${equivalentVolumes}, Anilist = ${totalVolumes}`);
	return "Em publicação";
}

function cleanAuthorName(name) {
	if (!name) return "";
	let cleaned = name.replace(/\s*\(.*?\)\s*/g, "");
	return cleaned.trim();
}

async function resolveAuthorsAndFranchise(currentSeries) {
	if (!currentSeries.authors || currentSeries.authors.length === 0) return [];

	const authorRegexes = currentSeries.authors
		.map((rawName) => cleanAuthorName(rawName))
		.filter((name) => name.length > 0)
		.map((cleanName) => {
			const escaped = escapeRegex(cleanName);
			return new RegExp(`^\\s*${escaped}\\s*(\\(.*\\))?\\s*$`, "i");
		});

	if (authorRegexes.length === 0) return [];

	const authorWorks = await Series.find({
		authors: { $in: authorRegexes },
		_id: { $ne: currentSeries._id },
	}).select("title relatedSeries authors anilistId");

	if (authorWorks.length === 0) return [];

	const adjList = new Map();
	const addEdge = (a, b) => {
		if (!adjList.has(a)) adjList.set(a, []);
		if (!adjList.has(b)) adjList.set(b, []);
		adjList.get(a).push(b);
	};

	if (currentSeries.relatedSeries) {
		currentSeries.relatedSeries.forEach((rel) => {
			if (rel.series && FRANCHISE_LINKS.includes(rel.relation)) {
				addEdge(currentSeries._id.toString(), rel.series.toString());
			}
		});
	}

	authorWorks.forEach((work) => {
		if (work.relatedSeries) {
			work.relatedSeries.forEach((rel) => {
				if (rel.series && FRANCHISE_LINKS.includes(rel.relation)) {
					addEdge(work._id.toString(), rel.series.toString());
				}
			});
		}
	});

	const visited = new Set();
	const queue = [currentSeries._id.toString()];
	visited.add(currentSeries._id.toString());

	while (queue.length > 0) {
		const curr = queue.shift();
		const neighbors = adjList.get(curr) || [];
		for (const next of neighbors) {
			if (!visited.has(next)) {
				visited.add(next);
				queue.push(next);
			}
		}
	}

	const sameAuthorRelations = [];
	for (const work of authorWorks) {
		if (currentSeries.anilistId && work.anilistId === currentSeries.anilistId)
			continue;

		if (!visited.has(work._id.toString())) {
			sameAuthorRelations.push({
				series: work._id,
				relation: "Mesmo Autor(a)",
			});
		}
	}

	return sameAuthorRelations;
}
async function syncAndRecalculateData() {
	await cleanUserDuplicates();
	await updateSeriesMetadata();
	await updateSeriesRelations();
	await recalculateUserListInfo();
	await updateSeriesPopularity();
	await recalculateRatings();
	return success();
}

async function updateSeriesRelations() {
	logger.info("Starting Internal Linking (Smart Deduplication Mode)...");

	let seriesProcessed = 0;
	let seriesModified = 0;
	let bulkOps = [];
	const BATCH_SIZE = 500;

	const cursor = Series.find({ shouldBeUpdated: true }).cursor();

	try {
		for (
			let series = await cursor.next();
			series != null;
			series = await cursor.next()
		) {
			let wasModified = false;
			const currentRelations = series.relatedSeries || [];

			const preservedRelations = currentRelations.filter(
				(rel) => !INTERNAL_RELATIONS.includes(rel.relation),
			);
			const existingInternalIds = new Set(
				currentRelations
					.filter((rel) => INTERNAL_RELATIONS.includes(rel.relation))
					.map((rel) => rel.series.toString()),
			);

			const blockedIds = new Set(
				preservedRelations.map((rel) => rel.series.toString()),
			);

			let calculatedEditionRelations = [];
			if (series.anilistId) {
				const otherEditions = await Series.find({
					anilistId: series.anilistId,
					_id: { $ne: series._id },
				}).select("_id title");

				calculatedEditionRelations = otherEditions
					.filter((s) => !blockedIds.has(s._id.toString()))
					.map((s) => ({
						series: s._id,
						relation: "Outra Edição",
					}));
			}

			calculatedEditionRelations.forEach((r) =>
				blockedIds.add(r.series.toString()),
			);

			const rawAuthorRelations = await resolveAuthorsAndFranchise(series);
			const calculatedAuthorRelations = rawAuthorRelations.filter(
				(rel) => !blockedIds.has(rel.series.toString()),
			);

			const allCalculatedInternal = [
				...calculatedEditionRelations,
				...calculatedAuthorRelations,
			];

			if (allCalculatedInternal.length !== existingInternalIds.size) {
				wasModified = true;
			} else {
				const allNewIds = allCalculatedInternal.map((r) => r.series.toString());
				const hasNewId = allNewIds.some((id) => !existingInternalIds.has(id));

				if (hasNewId) {
					wasModified = true;
				}
			}

			if (wasModified) {
				logger.warn(`Updating relations for ${series.title}`);

				const updatedRelatedSeries = [
					...preservedRelations,
					...calculatedEditionRelations,
					...calculatedAuthorRelations,
				];

				bulkOps.push({
					updateOne: {
						filter: { _id: series._id },
						update: {
							$set: {
								relatedSeries: updatedRelatedSeries,
							},
						},
					},
				});
				seriesModified++;
			}

			seriesProcessed++;

			if (bulkOps.length >= BATCH_SIZE) {
				await Series.bulkWrite(bulkOps);
				bulkOps = [];
			}
		}

		if (bulkOps.length > 0) {
			await Series.bulkWrite(bulkOps);
		}

		logger.info(
			`Internal Linking Complete. Processed: ${seriesProcessed}, Modified: ${seriesModified}.`,
		);
	} catch (error) {
		logger.error("Error linking internal relations:", error);
		throw error;
	}
}
async function cleanUserDuplicates() {
	logger.info("Starting cleanup of duplicate data (New Schema)...");

	let usersProcessed = 0;
	let usersModified = 0;
	let bulkOps = [];
	const BATCH_SIZE = 500;

	const cursor = User.find({}).cursor();

	try {
		for (
			let user = await cursor.next();
			user != null;
			user = await cursor.next()
		) {
			let wasModified = false;

			const uniqueWishListStrings = [
				...new Set(user.wishList.map((id) => id.toString())),
			];

			if (uniqueWishListStrings.length < user.wishList.length) {
				user.wishList = uniqueWishListStrings.map(
					(id) => new mongoose.Types.ObjectId(id),
				);
				wasModified = true;
			}

			const seenSeries = new Set();
			const uniqueUserList = [];

			for (const item of user.userList) {
				if (item && item.Series) {
					const seriesId = item.Series.toString();
					if (!seenSeries.has(seriesId)) {
						seenSeries.add(seriesId);
						uniqueUserList.push(item);
					}
				}
			}

			if (uniqueUserList.length < user.userList.length) {
				user.userList = uniqueUserList;
				wasModified = true;
			}

			const seenVolumes = new Set();
			const uniqueOwnedVolumes = [];

			for (const item of user.ownedVolumes) {
				if (item && item.volume) {
					const volId = item.volume.toString();
					if (!seenVolumes.has(volId)) {
						seenVolumes.add(volId);
						uniqueOwnedVolumes.push(item);
					}
				}
			}

			if (uniqueOwnedVolumes.length < user.ownedVolumes.length) {
				user.ownedVolumes = uniqueOwnedVolumes;
				wasModified = true;
			}

			if (wasModified) {
				logger.warn(`${user.username} Had duplicates`);
				bulkOps.push({
					updateOne: {
						filter: { _id: user._id },
						update: {
							$set: {
								wishList: user.wishList,
								userList: user.userList,
								ownedVolumes: user.ownedVolumes,
							},
						},
					},
				});
				usersModified++;
			}

			usersProcessed++;

			if (bulkOps.length >= BATCH_SIZE) {
				await User.bulkWrite(bulkOps);
				bulkOps = [];
			}
		}

		if (bulkOps.length > 0) {
			await User.bulkWrite(bulkOps);
		}

		logger.info(
			`Cleanup complete. Processed: ${usersProcessed}, Modified: ${usersModified}.`,
		);

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
		{ arrayFilters: [{ "element.status": { $exists: false } }] },
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
				user.ownedVolumes.map((item) => item.volume.toString()),
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
				]),
			);

			user.userList.forEach((listItem) => {
				if (!listItem.Series) return;

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
						ownedVolumesSet.has(vol._id.toString()),
					);

					const uniqueOwnedCount = new Set(
						ownedVolumeObjects.map((v) => v.number),
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
					listItem.completionPercentage,
				);
				if (listItem.status != "Dropped" && newStatus != listItem.status) {
					listItem.status = newStatus;
					wasModified = true;
				}
			});

			if (wasModified) {
				logger.warn(`Userlist Recalculated. User: ${user.username}`);
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

		if (bulkOps.length > 0) await Series.bulkWrite(bulkOps);

		await Series.updateMany(
			{
				_id: { $nin: popularityAggregation.map((p) => p._id) },
				popularity: { $gt: 0 },
			},
			{ $set: { popularity: 0 } },
		);

		logger.info("Series popularity updated");
	} catch (error) {
		logger.error("Error updating series popularity:", error);
		throw error;
	}
}

async function recalculateRatings() {
	logger.info("Recalculating series/volume rating averages...");

	try {
		// Volumes: plain average of that volume's scores.
		const volumeAgg = await Rating.aggregate([
			{ $match: { volume: { $ne: null } } },
			{ $group: { _id: "$volume", avg: { $avg: "$score" }, count: { $sum: 1 } } },
		]);

		const volumeBulk = volumeAgg.map(({ _id, avg, count }) => ({
			updateOne: {
				filter: { _id },
				update: {
					$set: { ratingAverage: Math.round(avg * 10) / 10, ratingCount: count },
				},
			},
		}));
		if (volumeBulk.length > 0) await volume.bulkWrite(volumeBulk);

		await volume.updateMany(
			{
				_id: { $nin: volumeAgg.map((v) => v._id) },
				$or: [{ ratingAverage: { $gt: 0 } }, { ratingCount: { $gt: 0 } }],
			},
			{ $set: { ratingAverage: 0, ratingCount: 0 } },
		);

		const seriesAgg = await Rating.aggregate([
			{
				$group: {
					_id: { series: "$series", user: "$user" },
					manualScore: {
						$max: { $cond: [{ $eq: ["$volume", null] }, "$score", null] },
					},
					volumeScores: {
						$push: { $cond: [{ $ne: ["$volume", null] }, "$score", "$$REMOVE"] },
					},
				},
			},
			{
				$addFields: {
					effectiveScore: {
						$cond: [
							{ $ne: ["$manualScore", null] },
							"$manualScore",
							{
								$cond: [
									{ $gt: [{ $size: "$volumeScores" }, 0] },
									{ $avg: "$volumeScores" },
									null,
								],
							},
						],
					},
				},
			},
			{ $match: { effectiveScore: { $ne: null } } },
			{
				$group: {
					_id: "$_id.series",
					avg: { $avg: "$effectiveScore" },
					count: { $sum: 1 },
				},
			},
		]);

		const seriesBulk = seriesAgg.map(({ _id, avg, count }) => ({
			updateOne: {
				filter: { _id },
				update: {
					$set: { ratingAverage: Math.round(avg * 10) / 10, ratingCount: count },
				},
			},
		}));
		if (seriesBulk.length > 0) await Series.bulkWrite(seriesBulk);

		await Series.updateMany(
			{
				_id: { $nin: seriesAgg.map((s) => s._id) },
				$or: [{ ratingAverage: { $gt: 0 } }, { ratingCount: { $gt: 0 } }],
			},
			{ $set: { ratingAverage: 0, ratingCount: 0 } },
		);

		logger.info(
			`Rating recalculation complete. Volumes rated: ${volumeAgg.length}, Series rated: ${seriesAgg.length}.`,
		);
	} catch (error) {
		logger.error("Error recalculating ratings:", error);
		throw error;
	}
}

async function updateSeriesMetadata() {
	logger.info("Starting sanitization of Series dates and status...");

	let seriesProcessed = 0;
	let seriesModified = 0;
	let bulkOps = [];
	const BATCH_SIZE = 500;

	const cursor = Series.find({ shouldBeUpdated: true }).cursor();

	try {
		for (
			let series = await cursor.next();
			series != null;
			series = await cursor.next()
		) {
			let wasModified = false;

			const volumesData = await volume
				.find({ serie: series._id })
				.select("number date")
				.sort({ number: 1 })
				.lean();

			const firstVol = volumesData.find((v) => v.number === 1);

			if (firstVol && firstVol.date) {
				if (
					!series.dates.publishedAt ||
					series.dates.publishedAt.getTime() !== firstVol.date.getTime()
				) {
					series.dates.publishedAt = firstVol.date;
					wasModified = true;
				}
			}

			const newStatus = calculateLocalStatus(series);
			if (series.status !== newStatus) {
				series.status = newStatus;
				wasModified = true;
			}

			if (series.status === "Finalizado" && volumesData.length > 0) {
				const lastVol = volumesData[volumesData.length - 1];

				if (lastVol && lastVol.date) {
					if (
						!series.dates.finishedAt ||
						series.dates.finishedAt.getTime() !== lastVol.date.getTime()
					) {
						series.dates.finishedAt = lastVol.date;
						wasModified = true;
					}
				}
			}

			if (wasModified) {
				logger.warn(`Updated: ${series.title}`);
				bulkOps.push({
					updateOne: {
						filter: { _id: series._id },
						update: {
							$set: {
								"dates.publishedAt": series.dates.publishedAt,
								"dates.finishedAt": series.dates.finishedAt,
								status: series.status,
							},
						},
					},
				});
				seriesModified++;
			}

			seriesProcessed++;

			if (bulkOps.length >= BATCH_SIZE) {
				await Series.bulkWrite(bulkOps);
				bulkOps = [];
			}
		}

		if (bulkOps.length > 0) {
			await Series.bulkWrite(bulkOps);
		}

		logger.info(
			`Series sanitization complete. Processed: ${seriesProcessed}, Modified: ${seriesModified}.`,
		);

		return { seriesProcessed, seriesModified };
	} catch (error) {
		logger.error("Error sanitizing series metadata:", error);
		throw error;
	}
}

module.exports = { syncAndRecalculateData };
