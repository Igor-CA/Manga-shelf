function getSeriesCoverURL(Series) {
	const sanitizedTitle = Series.title
		.replace(/[?:/–\s]+/g, "-")
		.replace(/-+/g, "-");
	const nameURL = encodeURIComponent(sanitizedTitle);
	const imageURL = `cover-${nameURL}-1.webp`;
	return imageURL;
}

function getVolumeCoverURL(Series, volumeNumber, variant = false, variantNumber = 1) {
	const sanitizedTitle = Series.title
		.replace(/[?:/–\s]+/g, "-")
		.replace(/-+/g, "-");
	const nameURL = encodeURIComponent(sanitizedTitle);
	const imageURL = `cover-${nameURL}-${volumeNumber}${
		variant ? `-variant-${variantNumber || 1}` : ""
	}.webp`;
	return imageURL;
}

module.exports = { getSeriesCoverURL, getVolumeCoverURL };
