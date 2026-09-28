const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const { ZipArchive } = require("archiver");

const User = require("../../models/User");
const Volume = require("../../models/volume");
const Series = require("../../models/Series");
const Rating = require("../../models/Rating");
const logger = require("../../Utils/logger");
const {
	VOLUME_COLUMNS,
	SERIES_COLUMNS,
	BOOLEAN_WORDS,
} = require("../../Utils/collectionExportContract");

const buildExportRows = async (userId) => {
	const user = await User.findById(userId)
		.select("userList wishList ownedVolumes")
		.lean();

	const ownedVolumeIds = user.ownedVolumes
		.filter((owned) => owned.volume)
		.map((owned) => owned.volume);

	const [volumes, ratings] = await Promise.all([
		Volume.find({ _id: { $in: ownedVolumeIds } })
			.select("number isVariant variantNumber serie")
			.lean(),
		Rating.find({ user: userId }).select("series volume score").lean(),
	]);
	const volumeById = new Map(volumes.map((v) => [v._id.toString(), v]));

	const userListEntries = user.userList.filter((entry) => entry.Series);
	const userListSeriesIds = userListEntries.map((entry) => entry.Series);
	const wishListSeriesIds = user.wishList || [];
	const ownedSeriesIds = volumes.map((v) => v.serie).filter(Boolean);
	const allSeriesIds = [
		...new Set(
			[...userListSeriesIds, ...wishListSeriesIds, ...ownedSeriesIds].map(
				(id) => id.toString(),
			),
		),
	];

	const seriesList = await Series.find({ _id: { $in: allSeriesIds } })
		.select("title publisher")
		.lean();
	const seriesById = new Map(seriesList.map((s) => [s._id.toString(), s]));

	const standardVolumeCounts = await Volume.aggregate([
		{
			$match: {
				serie: { $in: allSeriesIds.map((id) => new mongoose.Types.ObjectId(id)) },
				isVariant: { $ne: true },
			},
		},
		{ $group: { _id: "$serie", count: { $sum: 1 } } },
	]);
	const totalVolumeCountBySeriesId = new Map(
		standardVolumeCounts.map((r) => [r._id.toString(), r.count]),
	);

	const volumeScoreByVolumeId = new Map();
	const seriesManualScore = new Map();
	const seriesVolumeScores = new Map();
	for (const rating of ratings) {
		const seriesId = rating.series.toString();
		if (rating.volume) {
			volumeScoreByVolumeId.set(rating.volume.toString(), rating.score);
			if (!seriesVolumeScores.has(seriesId)) seriesVolumeScores.set(seriesId, []);
			seriesVolumeScores.get(seriesId).push(rating.score);
		} else {
			seriesManualScore.set(seriesId, rating.score);
		}
	}

	const volumeRows = [];
	for (const owned of user.ownedVolumes) {
		if (!owned.volume) continue;
		const volume = volumeById.get(owned.volume.toString());
		if (!volume || !volume.serie) continue;
		const series = seriesById.get(volume.serie.toString());
		if (!series) continue;

		volumeRows.push({
			volumeId: volume._id.toString(),
			seriesId: series._id.toString(),
			seriesTitle: series.title,
			volumeNumber: volume.number,
			variantNumber: volume.isVariant ? (volume.variantNumber ?? null) : null,
			isRead: !!owned.isRead,
			readAt: owned.readAt || null,
			readCount: owned.readCount ?? null,
			score: volumeScoreByVolumeId.get(volume._id.toString()) ?? null,
			purchasePrice: owned.purchasePrice ?? null,
			condition: owned.condition || null,
			store: owned.store || null,
			acquiredAt: owned.acquiredAt || null,
			amount: owned.amount ?? 1,
			notes: owned.notes || null,
			_isVariant: !!volume.isVariant,
		});
	}
	volumeRows.sort((a, b) => {
		const titleCompare = a.seriesTitle.localeCompare(b.seriesTitle, "pt-BR");
		if (titleCompare !== 0) return titleCompare;
		if (a.volumeNumber !== b.volumeNumber) return a.volumeNumber - b.volumeNumber;
		if (a._isVariant !== b._isVariant) return a._isVariant ? 1 : -1;
		return (a.variantNumber ?? 0) - (b.variantNumber ?? 0);
	});
	volumeRows.forEach((row) => delete row._isVariant);

	const ownedVolumeCountBySeriesId = new Map();
	for (const row of volumeRows) {
		ownedVolumeCountBySeriesId.set(
			row.seriesId,
			(ownedVolumeCountBySeriesId.get(row.seriesId) || 0) + 1,
		);
	}

	const collectionSeriesIds = new Set(
		userListSeriesIds.map((id) => id.toString()),
	);
	const wishlistSeriesIds = new Set(wishListSeriesIds.map((id) => id.toString()));
	const userListBySeriesId = new Map(
		userListEntries.map((entry) => [entry.Series.toString(), entry]),
	);

	const seriesRows = [];
	for (const seriesId of new Set([...collectionSeriesIds, ...wishlistSeriesIds])) {
		const series = seriesById.get(seriesId);
		if (!series) continue;

		const inCollection = collectionSeriesIds.has(seriesId);
		const listEntry = inCollection ? userListBySeriesId.get(seriesId) : null;
		const volumeScores = seriesVolumeScores.get(seriesId);
		const averageVolumeScore = volumeScores?.length
			? Math.round(
					(volumeScores.reduce((sum, score) => sum + score, 0) /
						volumeScores.length) *
						10,
				) / 10
			: null;

		seriesRows.push({
			seriesId,
			seriesTitle: series.title,
			publisher: series.publisher,
			list: inCollection ? "userList" : "wishList",
			collectionStatus: inCollection ? (listEntry?.status ?? null) : null,
			completionPercentage: inCollection
				? (listEntry?.completionPercentage ?? 0)
				: null,
			ownedVolumeCount: ownedVolumeCountBySeriesId.get(seriesId) || 0,
			totalVolumeCount: totalVolumeCountBySeriesId.get(seriesId) || 0,
			score: seriesManualScore.get(seriesId) ?? null,
			averageVolumeScore,
		});
	}
	seriesRows.sort((a, b) => a.seriesTitle.localeCompare(b.seriesTitle, "pt-BR"));

	return { volumeRows, seriesRows };
};

const quoteCsvValue = (value) => {
	const str = String(value ?? "");
	if (/[",\r\n]/.test(str)) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
};

const formatUtcDate = (date) => {
	const day = String(date.getUTCDate()).padStart(2, "0");
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	return `${day}/${month}/${date.getUTCFullYear()}`;
};

const formatCsvCell = (column, value) => {
	if (value === null || value === undefined) {
		if (column.type === "boolean") return BOOLEAN_WORDS[Boolean(value)];
		return "";
	}
	switch (column.type) {
		case "date":
			return formatUtcDate(new Date(value));
		case "boolean":
			return BOOLEAN_WORDS[Boolean(value)];
		case "enum":
			return column.values[value] ?? String(value);
		default:
			return String(value);
	}
};

const toCsv = (columns, rows) => {
	const lines = [columns.map((c) => quoteCsvValue(c.header)).join(",")];
	for (const row of rows) {
		lines.push(
			columns
				.map((c) => quoteCsvValue(formatCsvCell(c, row[c.key])))
				.join(","),
		);
	}
	return `${lines.join("\r\n")}\r\n`;
};

const streamCsvZip = (res, volumesCsv, seriesCsv) =>
	new Promise((resolve) => {
		const archive = new ZipArchive({ zlib: { level: 9 } });
		archive.on("error", (err) => {
			logger.error(`Erro ao gerar exportação em CSV: ${err}`);
			if (!res.destroyed) res.destroy(err);
			resolve();
		});
		archive.on("end", resolve);
		archive.pipe(res);
		archive.append(volumesCsv, { name: "volumes.csv" });
		archive.append(seriesCsv, { name: "obras.csv" });
		archive.finalize();
	});

const filenameDate = () =>
	new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
		new Date(),
	);

exports.exportCollection = asyncHandler(async (req, res) => {
	const { volumeRows, seriesRows } = await buildExportRows(req.user._id);
	const filename = `mangashelf-${req.user.username}-${filenameDate()}`;

	res.set({
		"Access-Control-Expose-Headers": "Content-Disposition",
		"Cache-Control": "no-store",
		"Content-Type": "application/zip",
		"Content-Disposition": `attachment; filename="${filename}.zip"`,
	});
	await streamCsvZip(
		res,
		toCsv(VOLUME_COLUMNS, volumeRows),
		toCsv(SERIES_COLUMNS, seriesRows),
	);
});

exports.buildExportRows = buildExportRows;
