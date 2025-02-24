import { useContext, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import "./Authentication.css";
import { messageContext } from "../../components/messageStateProvider";

export default function LoginPage() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({ login: "", password: "" });
	const { addMessage } = useContext(messageContext);
	const [captchaVal, setCaptchaVal] = useState(null);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!captchaVal) {
			addMessage("Captcha Invalido");
			return;
		}
		try {
			await axios({
				method: "POST",
				data: formData,
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/login`,
			});
			const userFetch = await axios({
				method: "GET",
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				url: `${
					import.meta.env.REACT_APP_HOST_ORIGIN
				}/api/data/user/logged-user`,
			});
			navigate(`/user/${userFetch.data.username}`);
			window.location.reload(true);
		} catch (error) {
			const customErrorMessage = error.response.data.msg;
			addMessage(customErrorMessage);
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

		addMessage(customErrorMessage);
	};

	const handleGoogleLogin = async () => {
		try {
			window.location.href = `${
				import.meta.env.REACT_APP_HOST_ORIGIN
			}/api/user/login/auth/google`;
		} catch (error) {
			console.error("Google login error:", error);
		}
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
						sitekey={import.meta.env.REACT_APP_CAPTCHA_KEY}
						onChange={(val) => {
							setCaptchaVal(val);
						}}
					/>

					<p>
						Não tem uma conta?{" "}
						<Link to={"/signup"} className="autentication-form__link">
							Crie uma agora
						</Link>{" "}
					</p>
					<Link to={"/forgot"} className="autentication-form__link">
						Esqueceu sua senha?
					</Link>

					<button className="button">Log in</button>
				</form>
				<button
					type="button"
					onClick={handleGoogleLogin}
					className="button autentication-form__button--google"
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
			</div>
		</div>
	);
}
