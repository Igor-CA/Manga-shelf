const MIN_PRICE_CONTRIBUTORS = 3;

const MAX_PRICE_COVER_MULTIPLE = 10;
const MAX_PRICE_ABSOLUTE = 1000;

const VOLUME_CONDITIONS = ["novo", "usado"];

const maxAllowedPrice = (coverPrice) =>
	coverPrice > 0 ? coverPrice * MAX_PRICE_COVER_MULTIPLE : MAX_PRICE_ABSOLUTE;

module.exports = {
	MIN_PRICE_CONTRIBUTORS,
	MAX_PRICE_COVER_MULTIPLE,
	MAX_PRICE_ABSOLUTE,
	VOLUME_CONDITIONS,
	maxAllowedPrice,
};
