import "./PostCard.css";

export default function SkeletonPostCard({ isReply = false }) {
	return (
		<div
			className={`post-card${isReply ? " post-card--reply" : ""}`}
			aria-hidden="true"
		>
			<div className="post-card__header">
				<div className="post-card__user-line">
					<div className="loader-animation post-card__skeleton-avatar" />
					<div className="loader-animation post-card__skeleton-username" />
				</div>
			</div>
			<div className="post-card__skeleton-text">
				<div className="loader-animation post-card__skeleton-line" />
				<div className="loader-animation post-card__skeleton-line" />
				<div className="loader-animation post-card__skeleton-line post-card__skeleton-line--short" />
			</div>
			<div className="post-card__footer">
				<div className="loader-animation post-card__skeleton-date" />
			</div>
		</div>
	);
}
