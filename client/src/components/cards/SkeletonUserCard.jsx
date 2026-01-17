import "./UserCard.css";
export default function SkeletonUserCard() {
	return (
			<div className="user-card">
				<div className="user-card__images-container">
					<div className="user-card__header"></div>
					<div className="user-card__picture-container">
						<div className="user-card__profile-picture loader-animation" />
					</div>
				</div>
				<div className="user-card__username loader-animation">
					Loader Username
				</div>
			</div>
	);
}
