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

export default function usePageMeta(title, description, { noindex = false } = {}) {
	useEffect(() => {
		document.title = title ? `${title} | MangaShelf` : DEFAULT_TITLE;

		const descriptionTag = document.querySelector('meta[name="description"]');
		if (descriptionTag) {
			descriptionTag.setAttribute("content", description || DEFAULT_DESCRIPTION);
		}

		let robotsTag = document.querySelector('meta[name="robots"]');
		if (noindex) {
			if (!robotsTag) {
				robotsTag = document.createElement("meta");
				robotsTag.setAttribute("name", "robots");
				document.head.appendChild(robotsTag);
			}
			robotsTag.setAttribute("content", "noindex");
		} else if (robotsTag) {
			// Sem isso a tag sobrevive à próxima navegação e desindexa a página seguinte
			robotsTag.remove();
		}
	}, [title, description, noindex]);
}
