import "./SeriesCard.css";
import { Link } from "react-router-dom";

export function SeriesCard({ seriesDetails }) {
	const { title, image, _id } = seriesDetails;
	const completionPercentage = seriesDetails.completionPercentage
		? seriesDetails.completionPercentage
		: null;
	return (
		<Link to={`../series/${_id}`} className="series-card">
			<div className="series-card__overlay">
				<strong className="series-card__title">{title}</strong>
			</div>
			<img src={image} alt={`cover of ${title}`} className="series-card__img" />

			{completionPercentage > 0 && (
				<div className="series-card__bar">
					<div
						className={`series-card__progress-bar  ${
							completionPercentage === 1
								? "series-card__progress-bar--completed"
								: null
						}`}
						style={{ width: `${completionPercentage * 100}%` }}
					></div>
				</div>
			)}
		</Link>
	);
}
