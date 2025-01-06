import { useState } from "react";
import "./SeriesCard.css";
import { Link } from "react-router-dom";

export function SeriesCard({ itemDetails, itemType }) {
	const [loaded, setLoaded] = useState(false);
	const { title, image, _id, completionPercentage, volumeNumber } = itemDetails;
	const link = itemType === "Series" ? `/series/${_id}` : `/volume/${_id}`;
	const imageText =
		itemType === "Series" ? title : `${title} - ${volumeNumber}`;

	const handleLoading = () => {
		setLoaded(true);
	};

	return (
		<div className="series-card">
			<Link to={link} className="series-card__image-container">
				<img
					src={`${
						import.meta.env.REACT_APP_HOST_ORIGIN
					}/images/medium/${image}`}
					srcSet={`
						${import.meta.env.REACT_APP_HOST_ORIGIN}/images/small/${image} 100w,
						${import.meta.env.REACT_APP_HOST_ORIGIN}/images/medium/${image} 400w, 
						${import.meta.env.REACT_APP_HOST_ORIGIN}/images/large/${image} 700w,
						${import.meta.env.REACT_APP_HOST_ORIGIN}/images/extralarge/${image} 1000w,`}
					sizes=" (min-width: 1024px) 15vw, 
							(min-width: 768px) 20vw, 
							(min-width: 360px) and (max-width: 768px) 35vw, 
							(max-width: 320px) 50vw"
					loading="lazy"
					alt={`cover of ${title}`}
					className={`series-card__img ${
						!loaded && "series-card__img--loading"
					}`}
					onLoad={handleLoading}
				/>
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
			<p className="series-card__title">{imageText}</p>
		</div>
	);
}
