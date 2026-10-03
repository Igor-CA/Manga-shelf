import { SiAnilist, SiMyanimelist } from "react-icons/si";
import { FaAmazon, FaExternalLinkAlt } from "react-icons/fa";
import "./ProviderChip.css";
import { recordLinkClick } from "./linkClicks";

const ICONS = { amazon: FaAmazon, anilist: SiAnilist, myanimelist: SiMyanimelist };

export default function ProviderChip({ link, targetModel, targetId }) {
	const Icon = ICONS[link.icon];

	const handleClick = () => {
		if (link.category === "store" && targetModel && targetId) {
			recordLinkClick({ provider: link.provider, targetModel, targetId });
		}
	};

	return (
		<a
			href={link.url}
			target="_blank"
			rel="noopener noreferrer"
			className="provider-chip"
			style={{ "--provider-chip-color": link.brandColor }}
			onClick={handleClick}
		>
			{Icon ? (
				<Icon className="provider-chip__icon" aria-hidden="true" />
			) : (
				<span className="provider-chip__dot" aria-hidden="true" />
			)}
			<span className="provider-chip__name">{link.name}</span>
			<FaExternalLinkAlt className="provider-chip__external" aria-hidden="true" />
		</a>
	);
}
