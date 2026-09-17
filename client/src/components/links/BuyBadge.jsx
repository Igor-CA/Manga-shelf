import { FaShoppingCart } from "react-icons/fa";
import "./BuyBadge.css";

export default function BuyBadge({ url, corner = "top-left" }) {
	if (!url) return null;

	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			title="Comprar na Amazon"
			className={`buy-badge buy-badge--${corner}`}
		>
			<FaShoppingCart aria-hidden="true" />
			<span className="buy-badge__label">Comprar</span>
		</a>
	);
}
