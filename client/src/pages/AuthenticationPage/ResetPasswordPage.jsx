import axios from "axios";
import { useContext, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { messageContext } from "../../components/messageStateProvider";

import "./Authentication.css";
export default function ResetPasswordPage() {
	const { userId, token } = useParams();
	const [formData, setFormData] = useState({ email: "" });
	const { addMessage } = useContext(messageContext);
	const navigate = useNavigate();

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};
	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			await axios({
				method: "POST",
				data: { ...formData, userId, token },
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/reset-password`,
			});
			navigate("/login");
		} catch (error) {
			const customErrorMessage = error.response.data.message;
			addMessage(customErrorMessage);
		}
	};

	const handleInvalid = (e) => {
		e.preventDefault();
		const inputName = e.target.name;
		const input = e.target;

		const validationMessages = {
			password: {
				valueMissing: "A senha é obrigatória",
				patternMismatch:
					"A senha deve conter pelo menos uma letra, número e caractere especial(!@#$%^&*)",
				tooShort: "A senha precisa de pelo menos 8 caracteres",
			},
			"confirm-password": {
				valueMissing: "O campo de confirmar senha é obrigatório",
				patternMismatch: "As senhas devem coincidir",
			},
		};

		const validationTypes = [
			"tooShort",
			"patternMismatch",
			"typeMismatch",
			"valueMissing",
		];
		const inputValidity = validationTypes.find((type) => input.validity[type]);

		const customErrorMessage = validationMessages[inputName][inputValidity];
		addMessage(customErrorMessage);
	};

	return (
		<div className="page-content">
			<div className="form-container">
				<h1 className="form-title">Defina sua nova senha</h1>
				<form
					method="post"
					className="autentication-form"
					onSubmit={(e) => {
						handleSubmit(e);
					}}
				>
					<label htmlFor="password" className="autentication-form__label">
						Senha:
					</label>
					<input
						type="password"
						name="password"
						placeholder="Password"
						id="password"
						className="autentication-form__input"
						onChange={(e) => {
							handleChange(e);
						}}
						onInvalid={(e) => {
							handleInvalid(e);
						}}
						required
						pattern="^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$"
						minLength="8"
					/>
					<label
						htmlFor="confirm-password"
						className="autentication-form__label"
					>
						Confirme sua senha:
					</label>
					<input
						type="password"
						name="confirm-password"
						placeholder="Confirm password"
						id="confirm-password"
						className="autentication-form__input"
						onChange={(e) => {
							handleChange(e);
						}}
						onInvalid={(e) => {
							handleInvalid(e);
						}}
						required
						pattern={formData.password}
					/>
					<Link to={"/login"} className="autentication-form__link">
						Entrar
					</Link>
					<button className="button">Definir nova senha</button>
				</form>
			</div>
		</div>
	);
}
