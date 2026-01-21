import { useState } from "react";
import axios from "axios";
import { FaUpload, FaImage } from "react-icons/fa";
import "./PhotoUploadForm.css";
import CustomCheckbox from "./customInputs/CustomCheckbox";

export default function PhotoUploadForm({ onPhotoAdded }) {
	const [selectedFile, setSelectedFile] = useState(null);
	const [preview, setPreview] = useState(null);
	const [description, setDescription] = useState("");
	const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
	const [order, setOrder] = useState(0);
	const [isVisible, setIsVisible] = useState(true);
	const [isAdultContent, setIsAdultContent] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState("");

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			const validTypes = ["image/jpeg", "image/png", "image/webp"];
			if (!validTypes.includes(file.type)) {
				setError("Apenas arquivos JPEG, PNG e WEBP são permitidos");
				return;
			}

			if (file.size > 10 * 1024 * 1024) {
				setError("O arquivo deve ter no máximo 10MB");
				return;
			}

			setError("");
			setSelectedFile(file);

			const reader = new FileReader();
			reader.onloadend = () => {
				setPreview(reader.result);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!selectedFile) {
			setError("Por favor, selecione uma foto");
			return;
		}

		setUploading(true);
		setError("");

		const formData = new FormData();
		formData.append("photo", selectedFile);
		formData.append("description", description);
		formData.append("date", date);
		formData.append("order", order);
		formData.append("isVisible", isVisible);
		formData.append("isAdultContent", isAdultContent);

		try {
			await axios({
				method: "POST",
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
					"Content-Type": "multipart/form-data",
				},
				data: formData,
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/collection-photos`,
			});

			// Reset form
			setSelectedFile(null);
			setPreview(null);
			setDescription("");
			setDate(new Date().toISOString().split("T")[0]);
			setOrder(0);
			setIsVisible(true);
			setIsAdultContent(false);

			onPhotoAdded();
		} catch (error) {
			setError(error.response?.data?.msg || "Erro ao fazer upload da foto");
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className="photo-upload-form">
			<h3 className="photo-upload-form__title">
				<FaUpload /> Adicionar Nova Foto
			</h3>

			<form onSubmit={handleSubmit} className="photo-upload-form__form">
				<div className="photo-upload-form__preview-section">
					<label className="photo-upload-form__file-input">
						<input
							type="file"
							accept="image/jpeg,image/png,image/webp"
							onChange={handleFileChange}
							style={{ display: "none" }}
						/>
						{preview ? (
							<div className="photo-upload-form__preview">
								<img src={preview} alt="Preview" />
								<div className="photo-upload-form__preview-overlay">
									<FaImage /> Clique para trocar
								</div>
							</div>
						) : (
							<div className="photo-upload-form__placeholder">
								<FaImage size={40} />
								<span>Clique para selecionar uma foto</span>
								<small>JPEG, PNG ou WEBP (max 10MB)</small>
							</div>
						)}
					</label>
				</div>

				<div className="photo-upload-form__fields">
					<div className="photo-upload-form__field">
						<label htmlFor="description">Descrição (opcional)</label>
						<textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Descreva esta foto..."
							rows="3"
							className="photo-upload-form__textarea"
						/>
					</div>

					<div className="photo-upload-form__row">
						<div className="photo-upload-form__field">
							<label htmlFor="date">Data</label>
							<input
								type="date"
								id="date"
								value={date}
								onChange={(e) => setDate(e.target.value)}
								className="photo-upload-form__input"
								required
							/>
						</div>

						<div className="photo-upload-form__field">
							<label htmlFor="order">Ordem</label>
							<input
								type="number"
								id="order"
								value={order}
								onChange={(e) => setOrder(e.target.value)}
								className="photo-upload-form__input"
								min="0"
							/>
						</div>
					</div>
					<CustomCheckbox
						htmlId={"isVisible"}
						label={"Visível publicamente"}
						defaultValue={isVisible}
						handleChange={(e) => setIsVisible(e.target.checked)}
					></CustomCheckbox>

					<CustomCheckbox
						htmlId={"isAdultContent"}
						label={
							<span style={{ color: "var(--red)" }}>Conteúdo adulto (+18)</span>
						}
						defaultValue={isAdultContent}
						handleChange={(e) => setIsAdultContent(e.target.checked)}
					></CustomCheckbox>

					{error && <div className="photo-upload-form__error">{error}</div>}

					<button
						type="submit"
						disabled={uploading || !selectedFile}
						className="button"
					>
						{uploading ? "Enviando..." : "Adicionar Foto"}
					</button>
				</div>
			</form>
		</div>
	);
}
