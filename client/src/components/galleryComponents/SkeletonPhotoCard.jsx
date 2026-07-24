import "./PhotoCard.css";

export default function SkeletonPhotoCard() {
	return (
		<div className="photo-card">
			<div className="photo-card__image-container loader-animation"></div>
		</div>
	);
}
