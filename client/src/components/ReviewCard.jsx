import { Link } from "react-router-dom";
import "./ReviewCard.css";

export default function ReviewCard({ review }) {
	const { user, score, text, createdAt } = review;
	const date = new Date(createdAt).toLocaleDateString("pt-BR", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	return (
		<div className="review-card">
			<div className="review-card__header">
				<Link
					to={`/user/${user.username}`}
					className="review-card__user"
				>
					{user.profileImageUrl ? (
						<img
							src={`${import.meta.env.REACT_APP_HOST_ORIGIN}${user.profileImageUrl}`}
							alt={user.username}
							className="review-card__avatar"
						/>
					) : (
						<div className="review-card__avatar review-card__avatar--placeholder">
							{user.username?.charAt(0).toUpperCase()}
						</div>
					)}
					<span className="review-card__username">{user.username}</span>
				</Link>
				<div className="review-card__score">
					<span className="review-card__score-value">{score}</span>
					<span className="review-card__score-max">/10</span>
				</div>
			</div>
			{text && <p className="review-card__text">{text}</p>}
			<span className="review-card__date">{date}</span>
		</div>
	);
}
