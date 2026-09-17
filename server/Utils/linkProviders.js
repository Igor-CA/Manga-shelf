const { isbn13ToIsbn10 } = require("./isbn");
const LinkProvider = require("../models/LinkProvider");

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

const derivedKeys = Object.values(DERIVED_IDS).flatMap(Object.keys);

const getDerivedProviders = () =>
	LinkProvider.find({ key: { $in: derivedKeys } }).lean();

const buildDerivedLinks = (targetModel, doc, providers, { isAdult } = {}) => {
	const builders = DERIVED_IDS[targetModel] || {};

	return providers
		.filter((provider) => !(isAdult && provider.category === "store"))
		.map((provider) => {
			const externalId = doc ? builders[provider.key]?.(doc) : null;
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
		.filter(Boolean);
};

const primaryStoreUrl = (links) =>
	links.find((link) => link.category === "store")?.url ?? null;

module.exports = {
	buildUrl,
	applyAffiliate,
	getDerivedProviders,
	buildDerivedLinks,
	primaryStoreUrl,
};
