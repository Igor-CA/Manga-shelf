import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { UserContext } from "../../contexts/userProvider";
import PhotoCard from "../../components/PhotoCard";
import PhotoUploadForm from "../../components/PhotoUploadForm";
import PhotoLightbox from "../../components/PhotoLightbox";
import "./CollectionGallery.css";

export default function CollectionGallery() {
	const { username } = useParams();
	const { user } = useContext(UserContext);
	const [photos, setPhotos] = useState([]);
	const [photosByDate, setPhotosByDate] = useState({});
	const [loading, setLoading] = useState(true);
	const [showUploadForm, setShowUploadForm] = useState(false);
	const [selectedPhoto, setSelectedPhoto] = useState(null);
	const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
	const isOwner = user?.username === username;

	useEffect(() => {
		fetchPhotos();
	}, [username]);

	const fetchPhotos = async () => {
		setLoading(true);
		try {
			const res = await axios({
				method: "GET",
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/${username}/collection-photos`,
			});
			setPhotos(res.data.photos);
			setPhotosByDate(res.data.photosByDate);
		} catch (error) {
			console.error("Erro ao carregar fotos:", error);
		} finally {
			setLoading(false);
		}
	};

	const handlePhotoAdded = () => {
		setShowUploadForm(false);
		fetchPhotos();
	};

	const handlePhotoDeleted = () => {
		fetchPhotos();
	};

	const handlePhotoUpdated = () => {
		fetchPhotos();
	};

	const handleViewPhoto = (photo) => {
		const index = photos.findIndex(p => p._id === photo._id);
		setSelectedPhotoIndex(index);
		setSelectedPhoto(photo);
	};

	const handleNextPhoto = () => {
		if (selectedPhotoIndex < photos.length - 1) {
			const nextIndex = selectedPhotoIndex + 1;
			setSelectedPhotoIndex(nextIndex);
			setSelectedPhoto(photos[nextIndex]);
		}
	};

	const handlePrevPhoto = () => {
		if (selectedPhotoIndex > 0) {
			const prevIndex = selectedPhotoIndex - 1;
			setSelectedPhotoIndex(prevIndex);
			setSelectedPhoto(photos[prevIndex]);
		}
	};

	const handleCloseLightbox = () => {
		setSelectedPhoto(null);
	};

	if (loading) {
		return (
			<div className="gallery-container">
				<div className="loading-message">Carregando galeria...</div>
			</div>
		);
	}

	return (
		<div className="gallery-container">
			{selectedPhoto && (
				<PhotoLightbox
					photo={selectedPhoto}
					onClose={handleCloseLightbox}
					onNext={handleNextPhoto}
					onPrev={handlePrevPhoto}
					hasNext={selectedPhotoIndex < photos.length - 1}
					hasPrev={selectedPhotoIndex > 0}
				/>
			)}

			<div className="gallery-header">
				<h2>Galeria da Coleção</h2>
				{isOwner && (
					<button
						className="button gallery-add-button"
						onClick={() => setShowUploadForm(!showUploadForm)}
					>
						{showUploadForm ? "Cancelar" : "+ Adicionar Foto"}
					</button>
				)}
			</div>

			{showUploadForm && isOwner && (
				<PhotoUploadForm onPhotoAdded={handlePhotoAdded} />
			)}

			{Object.keys(photosByDate).length === 0 ? (
				<div className="empty-gallery">
					<p>
						{isOwner
							? "Você ainda não adicionou fotos à sua galeria."
							: "Este usuário ainda não possui fotos na galeria."}
					</p>
				</div>
			) : (
				<div className="gallery-content">
					{Object.keys(photosByDate)
						.sort((a, b) => new Date(b) - new Date(a))
						.map((date) => (
							<div key={date} className="gallery-date-group">
								<h3 className="gallery-date-title" onView={handleViewPhoto}>
									{new Date(date + "T00:00:00").toLocaleDateString("pt-BR", {
										year: "numeric",
										month: "long",
										day: "numeric",
									})}
								</h3>
								<div className="gallery-photos-grid">
									{photosByDate[date]
										.sort((a, b) => a.order - b.order)
										.map((photo) => (
											<PhotoCard
												key={photo._id}
												photo={photo}
												isOwner={isOwner}
												onDelete={handlePhotoDeleted}
												onUpdate={handlePhotoUpdated}
												onView={handleViewPhoto}
											/>
										))}
								</div>
							</div>
						))}
				</div>
			)}
		</div>
	);
}
