import { FaShoppingCart } from "react-icons/fa";
import "./BuyBadge.css";
import { recordLinkClick } from "./linkClicks";

export default function BuyBadge({
	url,
	corner = "top-left",
	targetModel,
	targetId,
	provider = "amazon",
}) {
	if (!url) return null;

	const handleClick = () => {
		if (targetModel && targetId) {
			recordLinkClick({ provider, targetModel, targetId });
		}
	};

	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			title="Comprar na Amazon"
			className={`buy-badge buy-badge--${corner}`}
			onClick={handleClick}
		>
			<FaShoppingCart aria-hidden="true" />
			<span className="buy-badge__label">Comprar</span>
		</a>
	);
}
