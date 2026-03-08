import { useState } from "react";
import axios from "axios";
import "./ReviewForm.css";

export default function ReviewForm({
	seriesId,
	existingReview,
	onSaved,
	onCancel,
}) {
	const [score, setScore] = useState(existingReview?.score || 0);
	const [text, setText] = useState(existingReview?.text || "");
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (score < 1 || score > 10) {
			setError("Selecione uma nota de 1 a 10");
			return;
		}

		setSubmitting(true);
		setError("");

		try {
			await axios({
				method: "POST",
				withCredentials: true,
				headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
				data: { seriesId, score, text },
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/review`,
			});
			onSaved();
		} catch (err) {
			setError(
				err.response?.data?.msg || "Erro ao salvar review",
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form className="review-form" onSubmit={handleSubmit}>
			<h3 className="review-form__title">
				{existingReview ? "Editar review" : "Escrever review"}
			</h3>

			<div className="review-form__score-selector">
				<label>Nota:</label>
				<div className="review-form__scores">
					{Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
						<button
							key={n}
							type="button"
							className={`review-form__score-btn ${
								score === n ? "review-form__score-btn--active" : ""
							}`}
							onClick={() => setScore(n)}
						>
							{n}
						</button>
					))}
				</div>
			</div>

			<div className="review-form__field">
				<label htmlFor="review-text">Comentário (opcional)</label>
				<textarea
					id="review-text"
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="O que você achou dessa obra?"
					rows="5"
					maxLength={5000}
					className="review-form__textarea"
				/>
			</div>

			{error && <div className="review-form__error">{error}</div>}

			<div className="review-form__actions">
				<button
					type="submit"
					disabled={submitting || score === 0}
					className="button"
				>
					{submitting ? "Salvando..." : "Salvar"}
				</button>
				<button
					type="button"
					className="button button--secondary"
					onClick={onCancel}
				>
					Cancelar
				</button>
			</div>
		</form>
	);
}
