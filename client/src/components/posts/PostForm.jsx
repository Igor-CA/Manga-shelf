import { useState, useEffect, useRef, useContext } from "react";
import RateButton from "../contentHeader/RateButton";
import { UserContext } from "../../contexts/userProvider";
import { FaImage, FaTimes, FaEye } from "react-icons/fa";
import "./PostForm.css";
import "../contentHeader/contentHeader.css";

function PillToggle({ active, onClick, icon, children, className = "" }) {
	return (
		<button
			type="button"
			className={`post-form__pill${active ? " post-form__pill--active" : ""}${
				className ? ` ${className}` : ""
			}`}
			onClick={onClick}
			aria-pressed={active}
		>
			{icon}
			<span>{children}</span>
		</button>
	);
}

export default function PostForm({
	onSubmit,
	submitting,
	initialValue = "",
	isTopLevel = false,
	onCancel,
	isEdit = false,
	initialIsSpoiler = false,
	initialIsAdultContent = false,
	initialImage = null,
}) {
	const { user } = useContext(UserContext);
	const [text, setText] = useState(initialValue);
	const [reviewScore, setReviewScore] = useState(null);
	const [image, setImage] = useState(
		isEdit && initialImage ? { existing: initialImage } : null,
	);
	const [isSpoiler, setIsSpoiler] = useState(isEdit ? !!initialIsSpoiler : false);
	const [isAdultContent, setIsAdultContent] = useState(
		isEdit ? !!initialIsAdultContent : false,
	);
	const [previewUrl, setPreviewUrl] = useState(null);

	const [expanded, setExpanded] = useState(isEdit || !isTopLevel);
	const textareaRef = useRef(null);

	const isReview = !isEdit && isTopLevel && reviewScore != null;

	useEffect(() => {
		if (!image) {
			setPreviewUrl(null);
			return;
		}
		if (image instanceof File) {
			const url = URL.createObjectURL(image);
			setPreviewUrl(url);
			return () => URL.revokeObjectURL(url);
		}
		setPreviewUrl(`${import.meta.env.REACT_APP_HOST_ORIGIN}${image.existing}`);
	}, [image]);

	useEffect(() => {
		if (!expanded || !textareaRef.current) return;
		const el = textareaRef.current;
		el.focus();
		const end = el.value.length;
		el.setSelectionRange(end, end);
	}, [expanded]);

	const handleImageChange = (e) => {
		const file = e.target.files?.[0];
		if (file) setImage(file);
		e.target.value = "";
	};

	const removeImage = () => {
		setImage(null);
		setIsAdultContent(false);
	};

	const handleClose = () => {
		if (onCancel) onCancel();
		else setExpanded(false);
	};

	const submitDisabled = submitting || !text.trim();

	const handleSubmit = async (e) => {
		e.preventDefault();
		const trimmed = text.trim();
		if (!trimmed) return;

		if (isEdit) {
			await onSubmit({
				text: trimmed,
				isSpoiler,
				isAdultContent: image ? isAdultContent : false,
				image,
			});
			return;
		}

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
			setReviewScore(null);
			if (isTopLevel) setExpanded(false);
		}
	};

	const host = import.meta.env.REACT_APP_HOST_ORIGIN;
	const avatar = user?.profileImageUrl ? (
		<img
			src={`${host}${user.profileImageUrl}`}
			alt={user.username}
			className="post-form__avatar"
		/>
	) : (
		<div className="post-form__avatar post-form__avatar--placeholder">
			{user?.username?.charAt(0).toUpperCase()}
		</div>
	);

	const rootClass = `post-form${isTopLevel ? "" : " post-form--reply"}`;

	if (!expanded) {
		return (
			<div className={`${rootClass} post-form--collapsed`}>
				{avatar}
				<button
					type="button"
					className="post-form__collapsed-input"
					onClick={() => setExpanded(true)}
				>
					Compartilhe o que você achou…
				</button>
			</div>
		);
	}

	return (
		<form className={rootClass} onSubmit={handleSubmit}>
			<div className="post-form__header">
				{avatar}
				<span className="post-form__username">{user.username}</span>
				{isReview && <span className="post-form__review-chip">review</span>}
				<button
					type="button"
					className="post-form__close"
					onClick={handleClose}
					aria-label="Fechar"
				>
					<FaTimes />
				</button>
			</div>

			<textarea
				ref={textareaRef}
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
					<img
						src={previewUrl}
						alt="Prévia"
						className="post-form__image-thumb"
					/>
					<div className="post-form__image-meta">
						<span className="post-form__image-name">
							{image instanceof File ? image.name : "Imagem atual"}
						</span>
						<button
							type="button"
							className="post-form__image-remove"
							onClick={removeImage}
						>
							remover
						</button>
					</div>
					<PillToggle
						active={isAdultContent}
						onClick={() => setIsAdultContent((v) => !v)}
						className="post-form__pill--adult"
					>
						+18
					</PillToggle>
				</div>
			)}

			<div className="post-form__controls">
				<label
					className={`post-form__pill${image ? " post-form__pill--active" : ""}`}
				>
					<FaImage aria-hidden="true" />
					<span>Imagem</span>
					<input
						type="file"
						accept="image/jpeg,image/png,image/webp,image/gif"
						onChange={handleImageChange}
						className="post-form__image-input"
					/>
				</label>
				<PillToggle
					active={isSpoiler}
					onClick={() => setIsSpoiler((v) => !v)}
					icon={<FaEye aria-hidden="true" />}
				>
					Spoiler
				</PillToggle>
				{isTopLevel && !isEdit && (
					<div className="post-form__rate">
						<RateButton
							myScore={reviewScore}
							isDerived={false}
							loading={false}
							onSubmit={(n) => setReviewScore(n)}
							onRemove={() => setReviewScore(null)}
						/>
					</div>
				)}
				<button
					type="submit"
					disabled={submitDisabled}
					className="button post-form__submit"
				>
					{isEdit
						? submitting
							? "Salvando..."
							: "Salvar"
						: submitting
							? "Publicando..."
							: isReview
								? "Publicar review"
								: "Comentar"}
				</button>
			</div>
		</form>
	);
}
