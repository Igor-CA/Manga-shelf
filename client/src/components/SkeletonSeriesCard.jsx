import "./SeriesCard.css";
import { Link } from "react-router-dom";

export function SkeletonSeriesCard() {

	return (
		<div className="series-card">
			<div className="series-card__image-container series-card__loader">
                <div className="series-card__img"></div>
			</div>
			<div className="series-card__title series-card__loader">loader</div>
		</div>
	);
}
