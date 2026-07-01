import { useState } from "react";
import RateButton from "../contentHeader/RateButton";
import CustomToggle from "../customInputs/CustomToggle";
import "./PostForm.css";
import "../contentHeader/contentHeader.css";

export default function PostForm({
	onSubmit,
	submitting,
	initialValue = "",
	isTopLevel = false,
	currentScore = null,
}) {
	const [text, setText] = useState(initialValue);
	const [isReview, setIsReview] = useState(false);
	const [reviewScore, setReviewScore] = useState(currentScore);

	const handleToggleReview = (e) => {
		const checked = e.target.checked;
		setIsReview(checked);
		if (checked && reviewScore == null) setReviewScore(currentScore);
	};

	const submitDisabled =
		submitting || !text.trim() || (isReview && reviewScore == null);

	const handleSubmit = async (e) => {
		e.preventDefault();
		const trimmed = text.trim();
		if (!trimmed) return;
		if (isReview && reviewScore == null) return;

		const reviewData = isReview ? { isReview: true, score: reviewScore } : null;
		const ok = await onSubmit(trimmed, reviewData);
		if (ok) {
			setText("");
			if (isReview) {
				setIsReview(false);
				setReviewScore(currentScore);
			}
		}
	};

	return (
		<form className="post-form" onSubmit={handleSubmit}>
			<textarea
				value={text}
				onChange={(e) => setText(e.target.value)}
				placeholder={
					isReview ? "Escreva sua review..." : "Escreva um comentário..."
				}
				rows="3"
				maxLength={5000}
				className="post-form__textarea"
			/>
			<div className="post-form__review-container">
				{isTopLevel && isReview && (
					<div className="post-form__review-score">
						<span className="post-form__review-score-label">Nota:</span>
						<RateButton
							myScore={reviewScore}
							isDerived={false}
							loading={false}
							onSubmit={(n) => setReviewScore(n)}
							onRemove={() => setReviewScore(null)}
						/>
						{reviewScore == null && (
							<span className="post-form__review-score-hint">
								Selecione uma nota para publicar
							</span>
						)}
					</div>
				)}
				{isTopLevel && (
					<CustomToggle
						htmlId="post-review-toggle"
						label="Review"
						checked={isReview}
						handleChange={handleToggleReview}
					/>
				)}
			</div>
			<div className="post-form__actions">
				<button type="submit" disabled={submitDisabled} className="button">
					{submitting
						? "Publicando..."
						: isReview
							? "Publicar review"
							: "Comentar"}
				</button>
			</div>
		</form>
	);
}
