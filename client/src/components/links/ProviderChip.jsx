import { SiAmazon, SiAnilist } from "react-icons/si";
import { FaExternalLinkAlt } from "react-icons/fa";
import "./ProviderChip.css";

const ICONS = { amazon: SiAmazon, anilist: SiAnilist };

export default function ProviderChip({ link }) {
	const Icon = ICONS[link.icon];

	return (
		<a
			href={link.url}
			target="_blank"
			rel="noopener noreferrer"
			className="provider-chip"
			style={{ "--provider-chip-color": link.brandColor }}
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
