import { useState } from "react";
import "./PostForm.css";

export default function PostForm({ onSubmit, submitting, initialValue = "" }) {
	const [text, setText] = useState(initialValue);

	const handleSubmit = async (e) => {
		e.preventDefault();
		const trimmed = text.trim();
		if (!trimmed) return;

		const ok = await onSubmit(trimmed);
		if (ok) setText("");
	};

	return (
		<form className="post-form" onSubmit={handleSubmit}>
			<textarea
				value={text}
				onChange={(e) => setText(e.target.value)}
				placeholder="Escreva um comentário..."
				rows="3"
				maxLength={5000}
				className="post-form__textarea"
			/>
			<div className="post-form__actions">
				<button
					type="submit"
					disabled={submitting || !text.trim()}
					className="button"
				>
					{submitting ? "Publicando..." : "Comentar"}
				</button>
			</div>
		</form>
	);
}
