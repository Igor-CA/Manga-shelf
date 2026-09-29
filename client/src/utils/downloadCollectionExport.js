import axios from "axios";

const parseFilename = (contentDisposition, fallback) => {
	const match = /filename="?([^";]+)"?/.exec(contentDisposition || "");
	return match ? match[1] : fallback;
};

export const downloadCollectionExport = async (format) => {
	const response = await axios({
		method: "GET",
		withCredentials: true,
		responseType: "blob",
		headers: {
			Authorization: import.meta.env.REACT_APP_API_KEY,
		},
		params: { format },
		url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/export`,
	});

	const filename = parseFilename(
		response.headers["content-disposition"],
		`mangashelf-export.${format === "csv" ? "zip" : "xlsx"}`,
	);

	const url = window.URL.createObjectURL(response.data);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	window.URL.revokeObjectURL(url);
};
