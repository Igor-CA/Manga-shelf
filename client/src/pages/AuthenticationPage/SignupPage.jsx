import { useContext, useState } from "react";
import axios from "axios";
import "./Authentication.css";
import { Link, useNavigate } from "react-router-dom";
import { messageContext } from "../../components/messageStateProvider";

export default function SignupPage() {
	const navigate = useNavigate();
	const { addMessage } = useContext(messageContext);
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		username: "",
		password: "",
		email: "",
		"confirm-password": "",
	});

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
		
		if (name === "password" || name === "confirm-password") {
			const password = name === "password" ? value : formData.password;
			const confirm =
				name === "confirm-password" ? value : formData["confirm-password"];
			const confirmInput = document.getElementById("confirm-password");

			if (confirmInput && confirm) {
				if (password !== confirm) {
					confirmInput.setCustomValidity("As senhas devem coincidir");
				} else {
					confirmInput.setCustomValidity(""); 
				}
			}
		}
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
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/signup`,
			});
			navigate("/login");
		} catch (error) {
			const customErrorMessage = error.response.data.msg;
			addMessage(customErrorMessage);
		} finally {
			setLoading(false);
		}
	};
	const handleInvalid = (e) => {
		e.preventDefault();
		const inputName = e.target.name;
		const input = e.target;

		const validationMessages = {
			email: {
				valueMissing: "É obrigatório informar um email",
				typeMismatch: "O email inserido não é um email válido",
			},
			username: {
				valueMissing: "É obrigatório informar um nome de usuário",
				patternMismatch:
					"O nome de usuário não pode ter caracteres especiais (!@#$%^&*) e deve ter entre 3 e 16 caracteres.",
			},
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
			"tos-checkbox": {
				valueMissing: "Concorde com nossos termos para criar uma conta",
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
				<h1 className="form-title">Criar conta</h1>
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
						type="email"
						name="email"
						placeholder="Email"
						id="email"
						className="autentication-form__input"
						onChange={(e) => {
							handleChange(e);
						}}
						onInvalid={(e) => {
							handleInvalid(e);
						}}
						required
					/>
					<label htmlFor="username" className="autentication-form__label">
						User name:{" "}
					</label>
					<input
						type="text"
						name="username"
						placeholder="Nome de usuário"
						id="username"
						className="autentication-form__input"
						onChange={(e) => {
							handleChange(e);
						}}
						onInvalid={(e) => {
							handleInvalid(e);
						}}
						required
						pattern="^[A-Za-z0-9]{3,16}$"
						maxLength="16"
					/>
					<label htmlFor="password" className="autentication-form__label">
						Password:
					</label>
					<input
						type="password"
						name="password"
						placeholder="Senha"
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
						Confirm password:
					</label>
					<input
						type="password"
						name="confirm-password"
						placeholder="Confirmar senha"
						id="confirm-password"
						className="autentication-form__input"
						onChange={(e) => {
							handleChange(e);
						}}
						onInvalid={(e) => {
							handleInvalid(e);
						}}
						required
					/>
					<label htmlFor="tos-checkbox" className="form__label--visible">
						<input
							type="checkbox"
							name="tos-checkbox"
							id="tos-checkbox"
							className=""
							required
							onInvalid={(e) => {
								handleInvalid(e);
							}}
							onChange={(e) => {
								handleChange(e);
							}}
						/>
						Ao marcar esta aba você concorda com nossos{" "}
						<Link to={"/tos"} className="autentication-form__link">
							termos e condições
						</Link>
					</label>
					<button
						className={`button ${loading ? "button--disabled" : ""}`}
						disabled={loading}
					>
						Criar conta
					</button>
					<Link to={"/login"} className="autentication-form__link">
						Já tem conta?
					</Link>
				</form>
			</div>
		</div>
	);
}
