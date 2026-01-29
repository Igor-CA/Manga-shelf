import { useState } from "react";
import axios from "axios";
import {
	FaTrash,
	FaEdit,
	FaEye,
	FaEyeSlash,
	FaSearchPlus,
} from "react-icons/fa";
import PromptConfirm from "../../contexts/PromptConfirm";
import "./PhotoCard.css";
import CustomCheckbox from "../customInputs/CustomCheckbox";

export default function PhotoCard({
	photo,
	isOwner,
	onDelete,
	onUpdate,
	onView,
}) {
	const [showDeletePrompt, setShowDeletePrompt] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editedDescription, setEditedDescription] = useState(photo.description);
	const [editedDate, setEditedDate] = useState(photo.date.split("T")[0]);
	const [editedOrder, setEditedOrder] = useState(photo.order);
	const [editedVisible, setEditedVisible] = useState(photo.isVisible);
	const [editedAdultContent, setEditedAdultContent] = useState(
		photo.isAdultContent,
	);
	const [loading, setLoading] = useState(false);

	const handleDelete = async () => {
		setLoading(true);
		try {
			await axios({
				method: "DELETE",
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/collection-photos/${photo._id}`,
			});
			onDelete();
		} catch (error) {
			console.error("Erro ao deletar foto:", error);
			alert("Erro ao deletar foto");
		} finally {
			setLoading(false);
			setShowDeletePrompt(false);
		}
	};

	const handleUpdate = async () => {
		setLoading(true);
		try {
			await axios({
				method: "PUT",
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				data: {
					description: editedDescription,
					date: editedDate,
					order: Number(editedOrder),
					isVisible: editedVisible,
					isAdultContent: editedAdultContent,
				},
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/collection-photos/${photo._id}`,
			});
			setIsEditing(false);
			onUpdate();
		} catch (error) {
			console.error("Erro ao atualizar foto:", error);
			alert("Erro ao atualizar foto");
		} finally {
			setLoading(false);
		}
	};

	const cancelEdit = () => {
		setEditedDescription(photo.description);
		setEditedDate(photo.date.split("T")[0]);
		setEditedOrder(photo.order);
		setEditedVisible(photo.isVisible);
		setIsEditing(false);
	};

	return (
		<div className={"photo-card"}>
			{showDeletePrompt && (
				<PromptConfirm
					message="Tem certeza que deseja deletar esta foto?"
					onConfirm={handleDelete}
					onCancel={() => setShowDeletePrompt(false)}
				/>
			)}

			<div
				className={`photo-card__image-container ${!photo.isVisible ? "photo-card--hidden" : ""}`}
			>
				<img
					src={`${import.meta.env.REACT_APP_HOST_ORIGIN}${photo.imageUrl}`}
					alt={photo.description || "Foto da coleção"}
					className="photo-card__image"
					loading="lazy"
					onClick={() => onView(photo)}
					style={{ cursor: "pointer" }}
				/>
				<div
					className="photo-card__image-overlay"
					onClick={() => onView(photo)}
				>
					<FaSearchPlus className="photo-card__zoom-icon" />
				</div>
				{!photo.isVisible && isOwner && (
					<div className="photo-card__hidden-badge">
						<FaEyeSlash /> Oculta
					</div>
				)}
				{photo.isAdultContent && (
					<div className="photo-card__adult-badge">+18</div>
				)}
			</div>

			<div className="photo-card__content">
				{isEditing ? (
					<div className="photo-card__edit-form">
						<textarea
							value={editedDescription}
							onChange={(e) => setEditedDescription(e.target.value)}
							placeholder="Descrição..."
							className="photo-card__edit-textarea"
							rows="3"
						/>
						<label className="photo-card__edit__input-label">
							Data:
							<input
								type="date"
								value={editedDate}
								onChange={(e) => setEditedDate(e.target.value)}
								className="photo-card__edit-input"
							/>
						</label>
						<label className="photo-card__edit__input-label">
							Ordem:
							<input
								type="number"
								value={editedOrder}
								onChange={(e) => setEditedOrder(e.target.value)}
								className="photo-card__edit-input"
								min="0"
							/>
						</label>
						<CustomCheckbox
							htmlId={"isVisible"}
							label={"Visível publicamente"}
							defaultValue={editedVisible}
							handleChange={(e) => setEditedVisible(e.target.checked)}
						></CustomCheckbox>

						<CustomCheckbox
							htmlId={"isAdultContent"}
							label={
								<span style={{ color: "var(--red)" }}>
									Conteúdo adulto (+18)
								</span>
							}
							defaultValue={editedAdultContent}
							handleChange={(e) => setEditedAdultContent(e.target.checked)}
						></CustomCheckbox>

						<div className="photo-card__edit-actions">
							<button
								onClick={handleUpdate}
								disabled={loading}
								className="button button--grow button--primary"
							>
								{loading ? "Salvando..." : "Salvar"}
							</button>
							<button
								onClick={cancelEdit}
								disabled={loading}
								className="button button--red"
							>
								Cancelar
							</button>
						</div>
					</div>
				) : (
					<>
						{photo.description && (
							<p className="photo-card__description">{photo.description}</p>
						)}
						{isOwner && (
							<div className="photo-card__meta">
								<span className="photo-card__order">Ordem: {photo.order}</span>
								<span className="photo-card__visibility">
									{photo.isVisible ? <FaEye /> : <FaEyeSlash />}
									{photo.isVisible ? " Pública" : " Privada"}
								</span>
							</div>
						)}
					</>
				)}
			</div>

			{isOwner && !isEditing && (
				<div className="photo-card__actions">
					<button
						onClick={() => setIsEditing(true)}
						className="button button--grow button--primary"
						title="Editar"
					>
						<FaEdit />
					</button>
					<button
						onClick={() => setShowDeletePrompt(true)}
						className="button button--grow button--red"
						title="Deletar"
					>
						<FaTrash />
					</button>
				</div>
			)}
		</div>
	);
}
