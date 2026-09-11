const MIN_PRICE_CONTRIBUTORS = 3;

const MAX_PRICE_COVER_MULTIPLE = 10;
const MAX_PRICE_ABSOLUTE = 1000;

const VOLUME_CONDITIONS = ["novo", "usado"];

const parseCoverPrice = (defaultPrice) => {
	if (defaultPrice == null) return null;
	const parsed = parseFloat(String(defaultPrice).replace(",", "."));
	return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const maxAllowedPrice = (coverPrice) =>
	coverPrice == null
		? MAX_PRICE_ABSOLUTE
		: coverPrice * MAX_PRICE_COVER_MULTIPLE;

module.exports = {
	MIN_PRICE_CONTRIBUTORS,
	MAX_PRICE_COVER_MULTIPLE,
	MAX_PRICE_ABSOLUTE,
	VOLUME_CONDITIONS,
	parseCoverPrice,
	maxAllowedPrice,
};
