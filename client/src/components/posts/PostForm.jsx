import { useState, useEffect, useId } from "react";
import RateButton from "../contentHeader/RateButton";
import CustomToggle from "../customInputs/CustomToggle";
import { FaImage, FaTimes } from "react-icons/fa";
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
	const [image, setImage] = useState(null);
	const [isSpoiler, setIsSpoiler] = useState(false);
	const [isAdultContent, setIsAdultContent] = useState(false);
	const [previewUrl, setPreviewUrl] = useState(null);
	const formId = useId();

	useEffect(() => {
		if (!image) {
			setPreviewUrl(null);
			return;
		}
		const url = URL.createObjectURL(image);
		setPreviewUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [image]);

	const handleToggleReview = (e) => {
		const checked = e.target.checked;
		setIsReview(checked);
		if (checked && reviewScore == null) setReviewScore(currentScore);
	};

	const handleImageChange = (e) => {
		const file = e.target.files?.[0];
		if (file) setImage(file);
		e.target.value = "";
	};

	const removeImage = () => {
		setImage(null);
		setIsAdultContent(false);
	};

	const submitDisabled =
		submitting || !text.trim() || (isReview && reviewScore == null);

	const handleSubmit = async (e) => {
		e.preventDefault();
		const trimmed = text.trim();
		if (!trimmed) return;
		if (isReview && reviewScore == null) return;

		const reviewData = isReview ? { isReview: true, score: reviewScore } : null;
		const ok = await onSubmit(trimmed, reviewData, {
			image,
			isSpoiler,
			isAdultContent: image ? isAdultContent : false,
		});
		if (ok) {
			setText("");
			setImage(null);
			setIsSpoiler(false);
			setIsAdultContent(false);
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
			{previewUrl && (
				<div className="post-form__image-preview">
					<img src={previewUrl} alt="Prévia da imagem" />
					<button
						type="button"
						className="post-form__image-remove"
						onClick={removeImage}
						aria-label="Remover imagem"
					>
						<FaTimes />
					</button>
				</div>
			)}
			<div className="post-form__media">
				<label className="post-form__image-btn">
					<FaImage aria-hidden="true" />
					<span>Imagem</span>
					<input
						type="file"
						accept="image/jpeg,image/png,image/webp"
						onChange={handleImageChange}
						className="post-form__image-input"
					/>
				</label>
				{image && (
					<CustomToggle
						htmlId={`${formId}-adult`}
						label="Conteúdo adulto"
						checked={isAdultContent}
						handleChange={(e) => setIsAdultContent(e.target.checked)}
					/>
				)}
				<CustomToggle
					htmlId={`${formId}-spoiler`}
					label="Spoiler"
					checked={isSpoiler}
					handleChange={(e) => setIsSpoiler(e.target.checked)}
				/>
			</div>
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
						htmlId={`${formId}-review`}
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
