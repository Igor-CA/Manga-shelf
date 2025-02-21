import axios from "axios";
import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { messageContext } from "../../components/messageStateProvider";

import "./Authentication.css";
export default function ForgotPage() {
	const [formData, setFormData] = useState({ email: "" });
	const { addMessage, setMessageType } = useContext(messageContext);
	const [loading, setLoading] = useState(false);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			setLoading(true);
			await axios({
				method: "POST",
				data: formData,
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/forgot`,
			});
			addMessage("Um link para mudar sua senha foi enviado ao seu email");
			setMessageType("Success");
			setLoading(false);
		} catch (error) {
			const customErrorMessage = error.response.data.message;
			addMessage(customErrorMessage);
		}
	};

	const handleInvalid = (e) => {
		e.preventDefault();
		const inputName = e.target.name;
		const input = e.target;

		let customErrorMessage = "";

		if (input.validity.valueMissing) {
			customErrorMessage = `O campo de ${inputName} é obrigatório`;
		}

		addMessage(customErrorMessage);
	};

	return (
		<div className="page-content">
			<div className="form-container">
				<h1 className="form-title">Mude sua senha</h1>
				<form
					method="post"
					className="autentication-form"
					onSubmit={(e) => {
						handleSubmit(e);
					}}
				>
					<label htmlFor="email" className="autentication-form__label">
						Email:
					</label>
					<input
						type="text"
						name="email"
						id="email"
						placeholder="Email"
						className="autentication-form__input"
						value={formData.login}
						onChange={(e) => {
							handleChange(e);
						}}
						onInvalid={(e) => {
							handleInvalid(e);
						}}
						required
					/>
					<Link to={"/login"} className="autentication-form__link">
						Entrar
					</Link>
					<button
						className={`button ${loading ? "button--disabled" : ""}`}
						disabled={loading}
					>
						Mudar senha
					</button>
				</form>
			</div>
		</div>
	);
}
