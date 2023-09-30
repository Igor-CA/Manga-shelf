import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import "./Authentication.css";
import { Link, useNavigate } from "react-router-dom";

export default function SignupPage() {
	const navigate = useNavigate();
	const [errors, setErrors] = useState([]);
	const [formData, setFormData] = useState({
		username: "",
		password: "",
		email: "",
		"confirm-password": "",
	});

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const response = await axios({
				method: "POST",
				data: formData,
				withCredentials: true,
				url: `${process.env.REACT_APP_HOST_ORIGIN}/user/signup`,
			});
			navigate("/login");
		} catch (error) {
			const customErrorMessage = error.response.data.message;
			setErrors((prevErrors) => [...prevErrors, customErrorMessage]);

			setTimeout(() => {
				setErrors([]);
			}, 5000);
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

		setErrors((prevErrors) => [...prevErrors, customErrorMessage]);

		setTimeout(() => {
			setErrors([]);
		}, 5000);
	};

	const renderErrorsMessage = () => {
		return (
			<div className="errors-message">
				<FontAwesomeIcon icon={faCircleXmark} size="lg" />
				<div>
					{errors.map((erro, index) => {
						return (
							<p key={index} className="errors-message__error">
								{erro}
							</p>
						);
					})}
				</div>
			</div>
		);
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
						pattern={formData.password}
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
					<button className="button" style={{ margin: "10px" }}>
						Criar conta
					</button>
					<Link to={"/login"} className="autentication-form__link">
						Já tem conta?
					</Link>
				</form>
				{errors.length > 0 && renderErrorsMessage()}
			</div>
		</div>
	);
}
