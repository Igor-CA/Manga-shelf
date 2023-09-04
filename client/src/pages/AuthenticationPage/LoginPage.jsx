import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "../../components/userProvider";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import "./Authentication.css";

export default function LoginPage() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({ login: "", password: "" });
	const {user, setUser} = useContext(UserContext);
	const [errors, setErrors] = useState([]);

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
				url: `${process.env.REACT_APP_HOST_ORIGIN}/user/login`,
			});
			const userFetch = await axios({
				method: "GET",
				withCredentials: true,
				url: `${process.env.REACT_APP_HOST_ORIGIN}/api/user/logged-user`,
			});
			setUser(userFetch.data);
			console.log(response);
			console.log(userFetch.data);
			navigate(`../user/${userFetch.data.username}`);
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
			customErrorMessage = `${inputName} field is required.`;
		}

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
		<div className="form-container">
			<h1 className="form-title">Log in</h1>
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
					placeholder="Email or Username"
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
					placeholder="Password"
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
				<button className="autentication-form__button">Log in</button>
			</form>
			{errors.length > 0 && renderErrorsMessage()}
		</div>
	);
}
