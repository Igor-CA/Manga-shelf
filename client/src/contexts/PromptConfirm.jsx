import React, { useState } from "react";
import "./Prompts.css";

export default function PromptConfirm({
	message,
	onConfirm,
	onCancel,
	hidePrompt,
}) {
	const [userSayYes, setUserSayYes] = useState(null);

	const handleYesClick = () => {
		setUserSayYes(true);
		if (onConfirm && typeof onConfirm === 'function') {
			onConfirm();
		}
		hidePrompt(false);
	};

	const handleNoClick = () => {
		setUserSayYes(false);
		if (onCancel && typeof onCancel === 'function') {
			onCancel(false);
		}
		hidePrompt(false);
	};
	return (
		<div className="prompt-confirm">
			<p>{message}</p>
			<button onClick={handleYesClick} className="prompt-confirm__button">Confirmar</button>
			<button onClick={handleNoClick} className="prompt-confirm__button prompt-confirm__button--cancel">Cancelar</button>
		</div>
	);
}
