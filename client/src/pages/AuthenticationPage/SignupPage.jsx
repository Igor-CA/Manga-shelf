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
			console.log(response.data);
			navigate("./login");
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
				valueMissing: "The email field is required",
				typeMismatch: "The email must be a valid email address.",
			},
			username: {
				valueMissing: "The username field is required",
				patternMismatch:
					"The username can't contain special characters and between 3 and 16 characters.",
			},
			password: {
				valueMissing: "The password field is required",
				patternMismatch:
					"The password must contain at least one letter, one number, and a special character.",
				tooShort: "The password must be at least 8 characters long.",
			},
			"confirm-password": {
				valueMissing: "The confirm password field is required",
				patternMismatch: "Both passwords are not coinciding.",
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
				<h1 className="form-title">Sign up</h1>
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
						placeholder="Username"
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
					<label htmlFor="confirm-password" className="autentication-form__label">
						Confirm password:
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
						Already sign? click here to login
					</Link>
					<button className="button">Sign up</button>
				</form>
				{errors.length > 0 && renderErrorsMessage()}
			</div>
		</div>
	);
}
