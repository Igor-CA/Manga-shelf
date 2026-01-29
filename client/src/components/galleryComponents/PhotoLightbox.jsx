import { useEffect, useRef } from "react";
import { FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./PhotoLightbox.css";

export default function PhotoLightbox({
	photo,
	onClose,
	onNext,
	onPrev,
	hasNext,
	hasPrev,
}) {
	const dialogRef = useRef(null);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (dialog && !dialog.open) {
			dialog.showModal();
		}
	}, []);
	const handleBackdropClick = (e) => {
		const dialogDimensions = dialogRef.current.getBoundingClientRect();
		if (
			e.clientX < dialogDimensions.left ||
			e.clientX > dialogDimensions.right ||
			e.clientY < dialogDimensions.top ||
			e.clientY > dialogDimensions.bottom
		) {
			onClose();
		}
	};

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === "ArrowLeft" && hasPrev) onPrev();
			if (e.key === "ArrowRight" && hasNext) onNext();
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onNext, onPrev, hasNext, hasPrev]);

	return (
		<dialog
			ref={dialogRef}
			className="photo-lightbox"
			onClick={handleBackdropClick}
			onClose={onClose}
		>
			<div className="photo-lightbox__container">
				<button className="photo-lightbox__close" onClick={onClose}>
					<FaTimes />
				</button>

				{hasPrev && (
					<button
						className="photo-lightbox__nav photo-lightbox__nav--prev"
						onClick={(e) => {
							e.stopPropagation();
							onPrev();
						}}
					>
						<FaChevronLeft />
					</button>
				)}

				{hasNext && (
					<button
						className="photo-lightbox__nav photo-lightbox__nav--next"
						onClick={(e) => {
							e.stopPropagation();
							onNext();
						}}
					>
						<FaChevronRight />
					</button>
				)}

				<div
					className="photo-lightbox__content"
					onClick={(e) => e.stopPropagation()}
				>
					<img
						src={`${import.meta.env.REACT_APP_HOST_ORIGIN}${photo.imageUrl}`}
						alt={photo.description || "Foto da coleção"}
						className="photo-lightbox__image"
					/>
					{photo.description && (
						<div className="photo-lightbox__info">
							<p className="photo-lightbox__description">{photo.description}</p>
							<p className="photo-lightbox__date">
								{new Date(photo.date).toLocaleDateString("pt-BR", {
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							</p>
						</div>
					)}
				</div>
			</div>
		</dialog>
	);
}
