const { isbn13ToIsbn10 } = require("./isbn");
const LinkProvider = require("../models/LinkProvider");
const ExternalLink = require("../models/ExternalLink");

const buildUrl = (provider, externalId) =>
	provider?.urlTemplate && externalId
		? provider.urlTemplate.replace("{id}", externalId)
		: null;

const applyAffiliate = (provider, url) =>
	url && provider?.affiliateTemplate
		? provider.affiliateTemplate.replace("{url}", url)
		: url;

const DERIVED_IDS = {
	Series: {
		anilist: (series) => series.anilistId,
	},
	Volume: {
		amazon: (volume) => isbn13ToIsbn10(volume.ISBN),
	},
};

const getActiveProviders = () =>
	LinkProvider.find({ active: { $ne: false } }).lean();

const getStoredLinks = async (targetModel, targetIds) => {
	const byTarget = new Map();
	if (!targetIds.length) return byTarget;

	const links = await ExternalLink.find({
		targetModel,
		targetId: { $in: targetIds },
	}).lean();

	for (const link of links) {
		const key = link.targetId.toString();
		if (!byTarget.has(key)) byTarget.set(key, new Map());
		byTarget.get(key).set(link.provider, link.externalId);
	}
	return byTarget;
};

const buildDerivedLinks = (
	targetModel,
	doc,
	providers,
	storedLinks = new Map(),
	{ isAdult } = {},
) => {
	const builders = DERIVED_IDS[targetModel] || {};
	const storedForDoc = doc ? storedLinks.get(String(doc._id)) : null;

	return providers
		.filter((provider) => !(isAdult && provider.category === "store"))
		.map((provider) => {
			const externalId = doc
				? (builders[provider.key]?.(doc) ?? storedForDoc?.get(provider.key))
				: null;
			if (!externalId) return null;

			return {
				provider: provider.key,
				name: provider.name,
				category: provider.category,
				icon: provider.icon,
				brandColor: provider.brandColor,
				url: applyAffiliate(provider, buildUrl(provider, externalId)),
			};
		})
		.filter(Boolean)
		.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
};

const primaryStoreUrl = (links) =>
	links.find((link) => link.category === "store")?.url ?? null;

const domainMatches = (domains, host) =>
	(domains || []).some(
		(domain) => host === domain || host.endsWith(`.${domain}`),
	);

const matchProvider = (provider, url) => {
	let parsed;
	try {
		parsed = new URL(url);
	} catch {
		return null;
	}

	const host = parsed.hostname.replace(/^www\./i, "");
	if (!domainMatches(provider.domains, host)) return null;

	let regex;
	try {
		regex = new RegExp(provider.idPattern, "i");
	} catch {
		return null;
	}

	return url.match(regex)?.[1] || null;
};

module.exports = {
	buildUrl,
	applyAffiliate,
	getActiveProviders,
	getStoredLinks,
	buildDerivedLinks,
	primaryStoreUrl,
	matchProvider,
};
