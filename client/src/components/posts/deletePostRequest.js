import axios from "axios";

export default function deletePostRequest(postId) {
	return axios({
		method: "DELETE",
		withCredentials: true,
		headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
		url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/post/${postId}`,
	});
}
