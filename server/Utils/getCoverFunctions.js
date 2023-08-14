function getSeriesCoverURL(Series) {
	const sanitizedTitle = Series.title
		.replace(/[?:/–\s]+/g, "-")
		.replace(/-+/g, "-");
	const nameURL = encodeURIComponent(sanitizedTitle);
	const imageURL = `${process.env.HOST_ORIGIN}/images/cover-${nameURL}-1.jpg`;
	return imageURL;
}

function getVolumeCoverURL(Series, volumeNumber) {
	const sanitizedTitle = Series.title
		.replace(/[?:/–\s]+/g, "-")
		.replace(/-+/g, "-");
	const nameURL = encodeURIComponent(sanitizedTitle);
	const imageURL = `${process.env.HOST_ORIGIN}/images/cover-${nameURL}-${volumeNumber}.jpg`;
	return imageURL;
}

module.exports = { getSeriesCoverURL, getVolumeCoverURL };
