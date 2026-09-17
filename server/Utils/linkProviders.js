const { isbn13ToIsbn10 } = require("./isbn");

const buildUrl = (provider, externalId) =>
	provider?.urlTemplate && externalId
		? provider.urlTemplate.replace("{id}", externalId)
		: null;

const applyAffiliate = (provider, url) =>
	url && provider?.affiliateTemplate
		? provider.affiliateTemplate.replace("{url}", url)
		: url;

const buildAmazonBuyUrl = (provider, isbn) => {
	const asin = provider ? isbn13ToIsbn10(isbn) : null;
	return asin ? applyAffiliate(provider, buildUrl(provider, asin)) : null;
};

module.exports = { buildUrl, applyAffiliate, buildAmazonBuyUrl };
