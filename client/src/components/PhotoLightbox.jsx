import { useEffect } from "react";
import { FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./PhotoLightbox.css";

export default function PhotoLightbox({ photo, onClose, onNext, onPrev, hasNext, hasPrev }) {
	useEffect(() => {
		const handleEscape = (e) => {
			if (e.key === "Escape") onClose();
			if (e.key === "ArrowLeft" && hasPrev) onPrev();
			if (e.key === "ArrowRight" && hasNext) onNext();
		};

		document.addEventListener("keydown", handleEscape);
		document.body.style.overflow = "hidden";

		return () => {
			document.removeEventListener("keydown", handleEscape);
			document.body.style.overflow = "unset";
		};
	}, [onClose, onNext, onPrev, hasNext, hasPrev]);

	return (
		<div className="photo-lightbox" onClick={onClose}>
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

			<div className="photo-lightbox__content" onClick={(e) => e.stopPropagation()}>
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
	);
}
