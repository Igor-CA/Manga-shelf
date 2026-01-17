import React, { createContext, useContext, useState, useRef } from "react";
import { useEffect } from "react";
import "./EditVolumeModal.css";
import { messageContext } from "../components/messageStateProvider";
import axios from "axios";
import { UserContext } from "../components/userProvider";

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
	const [isRead, setIsRead] = useState(false);
	const [readCount, setReadCount] = useState(0);
	const [readAt, setReadAt] = useState("");
	const { addMessage, setMessageType } = useContext(messageContext);
	const { setOutdated } = useContext(UserContext);
	useEffect(() => {
		if (editingVolume) {
			setIsRead(editingVolume.isRead || false);
			setReadCount(editingVolume.readCount || 0);
			setReadAt(formatDateForInput(editingVolume.readAt));
		}
	}, [editingVolume]);
	if (!editingVolume) return <dialog ref={dialogRef} />;

	const handleIsReadChange = (e) => {
		const checked = e.target.checked;
		setIsRead(checked);

		if (checked) {
			if (readCount === 0) setReadCount(1);
			if (!readAt) setReadAt(new Date().toISOString().split("T")[0]);
		} else {
			setReadCount(0);
			setReadAt("");
		}
	};

	const handleReadCountChange = (e) => {
		const val = parseInt(e.target.value) || 0;
		setReadCount(val);

		if (val > 0) {
			setIsRead(true);
			if (!readAt) setReadAt(new Date().toISOString().split("T")[0]);
		} else {
			setIsRead(false);
			setReadAt("");
		}
	};

	const handleReadAtChange = (e) => {
		const val = e.target.value;
		setReadAt(val);

		if (val) {
			setIsRead(true);
			if (readCount === 0) setReadCount(1);
		}
	};
	const handleSubmit = async (e) => {
		e.preventDefault();
		const formData = new FormData(e.target);
		const rawUpdates = Object.fromEntries(formData.entries());

		const updates = {
			...rawUpdates,
			isRead: isRead,
			readCount: parseInt(rawUpdates.readCount) || 0,
			price: parseFloat(rawUpdates.price?.replace(",", ".")) || 0,
			acquiredAt: rawUpdates.acquiredAt ? rawUpdates.acquiredAt : null,
			readAt: readAt || null,
			amount: parseInt(rawUpdates.amount) || 1,
		};

		const finalPayload = {
			_id: editingVolume._id,
			...updates,
		};

		closeEditModal();
		try {
			const response = await axios({
				method: "PUT",
				data: finalPayload,
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				url: `${
					import.meta.env.REACT_APP_HOST_ORIGIN
				}/api/user/edit-owned-volumes`,
			});
			addMessage(response.data.msg);
			setMessageType("Success");
			setOutdated(true);
		} catch (err) {
			const customErrorMessage = err.response.data.msg;
			addMessage(customErrorMessage);
		}
	};
	const formatDateForInput = (isoDate) => {
		if (!isoDate) return "";
		return isoDate.split("T")[0];
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
							checked={isRead}
							onChange={handleIsReadChange}
							className="filter__checkbox"
						/>
					</label>
					<div className="input-group input-group--column">
						<label className="input-group">
							<span className="label-text">Data de leitura</span>
							<input
								type="date"
								name="readAt"
								value={readAt}
								onChange={handleReadAtChange}
								className="form__input"
							/>
						</label>
						<label className="input-group">
							<span className="label-text">Vezes Lido</span>
							<input
								type="number"
								name="readCount"
								value={readCount}
								onChange={handleReadCountChange}
								className="form__input"
							/>
						</label>
					</div>

					<div className="input-group input-group--column">
						<label className="input-group">
							<span className="label-text">Data de Aquisição</span>
							<input
								type="date"
								name="acquiredAt"
								defaultValue={formatDateForInput(editingVolume.acquiredAt)}
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
					</div>
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
							style={{ resize: "none" }}
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
