// Job responsible for regenerating the public sitemap.xml from the current catalog.
// Writes into server/public/, which app.js already serves statically at the site root,
// so the file is live at /sitemap.xml with no manual upload step.
const fs = require("fs/promises");
const path = require("path");
const Volume = require("../models/volume");
const Series = require("../models/Series");
const logger = require("../Utils/logger");
const { success } = require("./jobResult");

const SITEMAP_PATH = path.join(__dirname, "..", "public", "sitemap.xml");

function createUrlElement(url, changefreq, priority, lastmod) {
	const lastmodTag = lastmod ? `<lastmod>${lastmod.toISOString()}</lastmod>` : "";
	return `<url><loc>${url}</loc>${lastmodTag}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

function generateSitemap(series, volumes) {
	let sitemapXml =
		'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

	series.forEach((seriesDoc) => {
		const seriesUrl = `https://mangashelf.com.br/series/${seriesDoc._id}`;
		sitemapXml +=
			createUrlElement(seriesUrl, "weekly", "0.8", seriesDoc.updatedAt) + "\n";
	});

	volumes.forEach((volumeDoc) => {
		const volumeUrl = `https://mangashelf.com.br/volume/${volumeDoc._id}`;
		sitemapXml +=
			createUrlElement(volumeUrl, "weekly", "0.6", volumeDoc.updatedAt) + "\n";
	});

	const staticPages = [
		{
			url: "https://mangashelf.com.br",
			changefreq: "monthly",
			priority: "1",
		},
		{
			url: "https://mangashelf.com.br/login",
			changefreq: "monthly",
			priority: "0.5",
		},
		{
			url: "https://mangashelf.com.br/signup",
			changefreq: "monthly",
			priority: "0.5",
		},
		{
			url: "https://mangashelf.com.br/tos",
			changefreq: "monthly",
			priority: "0.5",
		},
		{
			url: "https://mangashelf.com.br/privacy",
			changefreq: "monthly",
			priority: "0.5",
		},
		{
			url: "https://mangashelf.com.br/browse",
			changefreq: "monthly",
			priority: "1",
		},
		{
			url: "https://mangashelf.com.br/feedback",
			changefreq: "monthly",
			priority: "0.5",
		},
		{
			url: "https://mangashelf.com.br/about",
			changefreq: "monthly",
			priority: "0.8",
		},
		{
			url: "https://mangashelf.com.br/donate",
			changefreq: "monthly",
			priority: "0.8",
		},
	];

	staticPages.forEach((page) => {
		sitemapXml +=
			createUrlElement(page.url, page.changefreq, page.priority) + "\n";
	});

	sitemapXml += "</urlset>";

	return sitemapXml;
}

async function generateSitemapFile() {
	logger.info("Running sitemap generator...");

	const series = await Series.find({ isAdult: false })
		.select("_id updatedAt")
		.sort({ title: 1 });
	const seriesIds = series.map((seriesDoc) => seriesDoc._id);
	const volumes = await Volume.find({ serie: { $in: seriesIds } }).select(
		"_id updatedAt",
	);

	const sitemapXml = generateSitemap(series, volumes);

	const tempPath = `${SITEMAP_PATH}.tmp`;
	await fs.writeFile(tempPath, sitemapXml);
	await fs.rename(tempPath, SITEMAP_PATH);

	logger.info(
		`Sitemap generated: ${series.length} series, ${volumes.length} volumes -> ${SITEMAP_PATH}`,
	);
	return success();
}

module.exports = { generateSitemapFile, generateSitemap };
