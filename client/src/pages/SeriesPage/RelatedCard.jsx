import { useState } from "react";
import { Link } from "react-router-dom";

export default function RelatedCard({ relatedSeries }) {
	const [loaded, setLoaded] = useState(false);
	const { title, relation, image, seriesId } = relatedSeries;

	const handleLoading = () => {
		setLoaded(true);
	};

	return (
		<li className="related-card">
			<Link
				to={`/series/${seriesId}`}
				className="related-card__image-container"
			>
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
							(max-width: 768px) 20vw, "
					loading="lazy"
					alt={`cover ${title}`}
					className={`related-card__image ${
						loaded ? "" : "related-card__image--loading"
					}`}
					onLoad={handleLoading}
				/>
			</Link>
			<Link to={`/series/${seriesId}`} className="related-card__info-container">
				<div>
					<strong>Obra: </strong>
					{title}
				</div>
				<div>
					<strong>Relação: </strong>
					{relation}
				</div>
			</Link>
		</li>
	);
}
