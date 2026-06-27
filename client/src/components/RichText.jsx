import { Link } from "react-router-dom";

export default function RichText({ text }) {
	if (!text) return null;

	const regex = /(\[\[.*?\|.*?\]\])|(\*\*.*?\*\*)|(@\w+)/g;

	return (
		<>
			{text
				.split(regex)
				.filter(Boolean)
				.map((part, index) => {
					if (part.startsWith("[[") && part.endsWith("]]")) {
						const content = part.slice(2, -2);
						const [label, url] = content.split("|");
						return (
							<Link key={index} to={url} className="notification-link">
								{label}
							</Link>
						);
					}

					if (part.startsWith("**") && part.endsWith("**")) {
						return <strong key={index}>{part.slice(2, -2)}</strong>;
					}

					if (part.startsWith("@")) {
						const username = part.slice(1);
						return (
							<Link key={index} to={`/user/${username}`} className="mention">
								{part}
							</Link>
						);
					}

					return <span key={index}>{part}</span>;
				})}
		</>
	);
}
