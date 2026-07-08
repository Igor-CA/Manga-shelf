import axios from "axios";

export default function createPostRequest({
	seriesId,
	volumeId,
	text,
	parentId,
	isReview,
	isSpoiler,
	isAdultContent,
	image,
}) {
	const url = `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/post`;
	const headers = { Authorization: import.meta.env.REACT_APP_API_KEY };

	if (image) {
		const formData = new FormData();
		formData.append("image", image);
		formData.append("text", text);
		formData.append("seriesId", seriesId);
		if (volumeId) formData.append("volumeId", volumeId);
		if (parentId) formData.append("parentId", parentId);
		if (isReview) formData.append("isReview", "true");
		if (isSpoiler) formData.append("isSpoiler", "true");
		if (isAdultContent) formData.append("isAdultContent", "true");
		return axios({ method: "POST", withCredentials: true, headers, url, data: formData });
	}

	return axios({
		method: "POST",
		withCredentials: true,
		headers,
		url,
		data: {
			seriesId,
			...(volumeId ? { volumeId } : {}),
			text,
			...(parentId ? { parentId } : {}),
			...(isReview ? { isReview: true } : {}),
			...(isSpoiler ? { isSpoiler: true } : {}),
		},
	});
}
