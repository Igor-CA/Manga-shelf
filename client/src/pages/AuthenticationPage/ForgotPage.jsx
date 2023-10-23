import axios from "axios";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

export default function ForgotPage() {
	const [formData, setFormData] = useState({ email: "" });
	const [errors, setErrors] = useState([]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
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

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const response = await axios({
				method: "POST",
				data: formData,
				withCredentials: true,
				headers: {
					Authorization:process.env.REACT_APP_API_KEY,
				},
				url: `/api/user/forgot`,
			});
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
					<button className="button">Mudar senha</button>
				</form>
				{errors.length > 0 && renderErrorsMessage()}
			</div>
		</div>
	);
}
