import { useEffect } from "react";

const DEFAULT_TITLE = document.title;
const DEFAULT_DESCRIPTION =
	document.querySelector('meta[name="description"]')?.getAttribute("content") ||
	"";

export const truncate = (text, max = 155) => {
	if (!text) return "";
	const clean = text.replace(/\s+/g, " ").trim();
	if (clean.length <= max) return clean;
	return `${clean.slice(0, max - 1).trimEnd()}…`;
};

export default function usePageMeta(title, description) {
	useEffect(() => {
		document.title = title ? `${title} | MangaShelf` : DEFAULT_TITLE;

		const descriptionTag = document.querySelector('meta[name="description"]');
		if (descriptionTag) {
			descriptionTag.setAttribute("content", description || DEFAULT_DESCRIPTION);
		}
	}, [title, description]);
}
