import React, { createContext, useContext, useState, useRef } from "react";
import { useEffect } from "react";
import "./EditVolumeModal.css";

const EditVolumeContext = createContext();

export const EditVolumeProvider = ({ children }) => {
	const [editingVolume, setEditingVolume] = useState(null);
	const dialogRef = useRef(null);

	const openEditModal = (volumeData) => {
		setEditingVolume(volumeData);
		dialogRef.current?.showModal();
	};

	const closeEditModal = () => {
		dialogRef.current?.close();
		setEditingVolume(null);
	};

	return (
		<EditVolumeContext.Provider
			value={{ openEditModal, closeEditModal, editingVolume, dialogRef }}
		>
			{children}
			<EditVolumeModal />
		</EditVolumeContext.Provider>
	);
};

export const useEditVolume = () => {
	return useContext(EditVolumeContext);
};

const EditVolumeModal = () => {
	const { editingVolume, closeEditModal, dialogRef } =
		useContext(EditVolumeContext);

	if (!editingVolume) return <dialog ref={dialogRef} />;

	const handleSubmit = async (e) => {
		e.preventDefault();
		const formData = new FormData(e.target);
		const updates = Object.fromEntries(formData.entries());

		console.log("Saving updates for volume ID:", editingVolume._id, updates);

		closeEditModal();
	};

	return (
		<dialog ref={dialogRef} className="edit-modal">
			<div className="modal-content">
				<h2 className="modal-title">
					Editar Informações de {editingVolume.title} volume{" "}
					{editingVolume.volumeNumber}
				</h2>
				<form onSubmit={handleSubmit} className="modal-form">

					<label className="filter__checkbox-container filter__checkbox-container--left">
						<span className="label-text">Lido</span>
						<input
							type="checkbox"
							name="isRead"
							defaultChecked={editingVolume.isRead}
                            className="filter__checkbox"
						/>
					</label>
					<label className="input-group">
						<span className="label-text">Vezes Lido</span>
						<input
							type="number"
							name="readCount"
							defaultValue={editingVolume.readCount || 0}
							className="form__input"
						/>
					</label>

					<label className="input-group">
						<span className="label-text">Preço pago</span>
						<input
							type="number"
							name="price"
							defaultValue={editingVolume.purchasePrice || 0}
							className="form__input"
							step="0.01"
						/>
					</label>

					<label className="input-group">
						<span className="label-text">Quantidade de cópias</span>
						<input
							type="number"
							name="amount"
							defaultValue={editingVolume.amount || 1}
							className="form__input"
						/>
					</label>
					<label className="input-group">
						<span className="label-text">Anotações pessoais</span>
						<textarea
							name="notes"
							defaultValue={editingVolume.notes || ""}
							rows={5}
							className="form__input"
						/>
					</label>

					<div className="modal-actions">
						<button
							type="button"
							onClick={closeEditModal}
							className="button button--red"
						>
							Cancelar
						</button>
						<button type="submit" className="button">
							Salvar Mudanças
						</button>
					</div>
				</form>
			</div>
		</dialog>
	);
};
