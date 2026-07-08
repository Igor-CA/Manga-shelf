import axios from "axios";

export default function editPostRequest({
	postId,
	seriesId,
	volumeId,
	text,
	isSpoiler,
	isAdultContent,
	image,
	removeImage,
}) {
	const url = `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/post/${postId}`;
	const headers = { Authorization: import.meta.env.REACT_APP_API_KEY };

	if (image instanceof File) {
		const formData = new FormData();
		formData.append("image", image);
		formData.append("text", text);
		formData.append("seriesId", seriesId);
		if (volumeId) formData.append("volumeId", volumeId);
		if (isSpoiler) formData.append("isSpoiler", "true");
		if (isAdultContent) formData.append("isAdultContent", "true");
		return axios({ method: "PATCH", withCredentials: true, headers, url, data: formData });
	}

	return axios({
		method: "PATCH",
		withCredentials: true,
		headers,
		url,
		data: {
			seriesId,
			...(volumeId ? { volumeId } : {}),
			text,
			...(isSpoiler ? { isSpoiler: true } : {}),
			...(isAdultContent ? { isAdultContent: true } : {}),
			...(removeImage ? { removeImage: true } : {}),
		},
	});
}
