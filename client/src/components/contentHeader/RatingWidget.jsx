import { FaStar } from "react-icons/fa";

// Global rating display only (★ 8.4 (12 notas)).
// The interactive rate control lives in RateButton, rendered in the action row.
export default function RatingWidget({ ratingAverage, ratingCount }) {
	const hasGlobal = ratingCount > 0;

	return (
		<div className="rating-widget">
			<div className="rating-widget__global">
				<FaStar className="rating-widget__global-star" aria-hidden="true" />
				<span className="rating-widget__avg">
					{hasGlobal ? ratingAverage.toFixed(1) : "—"}
				</span>
				<span className="rating-widget__count">
					({ratingCount} {ratingCount === 1 ? "nota" : "notas"})
				</span>
			</div>
		</div>
	);
}
