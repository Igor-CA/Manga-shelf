import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "../../components/userProvider";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import ReCAPTCHA from "react-google-recaptcha";
import "./Authentication.css";

export default function LoginPage() {
	const navigate = useNavigate();
	const { setOutdated } = useContext(UserContext);
	const [formData, setFormData] = useState({ login: "", password: "" });
	const [errors, setErrors] = useState([]);
	const [captchaVal, setCaptchaVal] = useState(null);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!captchaVal) {
			setErrors((prevErrors) => [...prevErrors, "Captcha Invalido"]);

			setTimeout(() => {
				setErrors([]);
			}, 5000);
			return;
		}
		try {
			const response = await axios({
				method: "POST",
				data: formData,
				withCredentials: true,
				headers: {
					Authorization: process.env.REACT_APP_API_KEY,
				},
				url: `/api/user/login`,
			});
			const userFetch = await axios({
				method: "GET",
				withCredentials: true,
				headers: {
					Authorization: process.env.REACT_APP_API_KEY,
				},
				url: `/api/data/user/logged-user`,
			});
			navigate(`/user/${userFetch.data.username}`);
			window.location.reload(true);
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

		let customErrorMessage = "";

		if (input.validity.valueMissing) {
			customErrorMessage = `O campo de ${inputName} é obrigatório.`;
		}

		setErrors((prevErrors) => [...prevErrors, customErrorMessage]);

		setTimeout(() => {
			setErrors([]);
		}, 5000);
	};

	const handleGoogleLogin = async () => {
		try {
			window.location.href = `${process.env.REACT_APP_HOST_ORIGIN}/api/user/login/auth/google`;
		} catch (error) {
			console.error("Google login error:", error);
		}
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
				<h1 className="form-title">Entrar</h1>
				<form
					action="/login"
					method="post"
					className="autentication-form"
					onSubmit={(e) => {
						handleSubmit(e);
					}}
				>
					<label htmlFor="login" className="autentication-form__label">
						Nome de usuário:
					</label>
					<input
						type="text"
						name="login"
						id="login"
						placeholder="Email ou nome de usuário"
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
					<label htmlFor="password" className="autentication-form__label">
						Senha:
					</label>
					<input
						type="password"
						name="password"
						id="password"
						placeholder="Senha"
						className="autentication-form__input"
						value={formData.password}
						onChange={(e) => {
							handleChange(e);
						}}
						onInvalid={(e) => {
							handleInvalid(e);
						}}
						required
					/>
					<ReCAPTCHA
						className="autentication-form__captcha"
						sitekey={process.env.REACT_APP_CAPTCHA_KEY}
						onChange={(val) => {
							setCaptchaVal(val);
						}}
					/>

					<p>
						Não tem uma conta?
						<Link to={"/signup"} className="autentication-form__link">
							{" "}
							clique aqui
						</Link>{" "}
						para criar
					</p>
					<Link to={"/forgot"} className="autentication-form__link">
						Esqueceu sua senha?
					</Link>

					<button className="autentication-form__button">Log in</button>
				</form>
				<button
					type="button"
					onClick={handleGoogleLogin}
					className="autentication-form__button autentication-form__button--google"
				>
					<svg
						className="autentication-form__icon"
						aria-hidden="true"
						focusable="false"
						data-prefix="fab"
						data-icon="google"
						role="img"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 488 512"
					>
						<path
							fill="currentColor"
							d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
						></path>
					</svg>
					Logar com o Google
				</button>
				{errors.length > 0 && renderErrorsMessage()}
			</div>
		</div>
	);
}
