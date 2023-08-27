import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import "./Authentication.css";

export default function SignupPage() {
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
		} catch (error) {
			console.error("Error fetching user Data:", error);
		}
	};
	const handleInvalid = (e) => {
		e.preventDefault();
		const inputName = e.target.name;
		const input = e.target;

		const validationMessages = {
			email: {
				typeMismatch: "The email must be a valid email address.",
			},
			username: {
				patternMismatch: "The username must be at least 3 characters long.",
			},
			password: {
				patternMismatch:
					"The password must contain at least one letter, one number, and a special character.",
				tooShort: "The password must be at least 8 characters long.",
			},
			"confirm-password": {
				patternMismatch: "Both passwords are not coinciding.",
			},
		};

		let validationType = input.validationMessage;
		if (input.validity.tooShort) {
			validationType = "tooShort";
		} else if (input.validity.patternMismatch) {
			validationType = "patternMismatch";
		} else if (input.validity.typeMismatch) {
			validationType = "typeMismatch";
		}

		const customErrorMessage = validationMessages[inputName][validationType];

		setTimeout(() => {
			setErrors([]);
		}, 5000);

		setErrors((prevErrors) => [...prevErrors, customErrorMessage]);
	};

	const renderErrorsMessage = () => {
		return (
			<div className="errors-container">
				<FontAwesomeIcon icon={faCircleXmark} size="lg" />
				<p>
					{errors.map((erro, index) => {
						return (
							<>
								{erro}
								<br />
							</>
						);
					})}
				</p>
			</div>
		);
	};

	return (
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
				<button className="autentication-form__button">Sign up</button>
			</form>
			{errors.length > 0 && renderErrorsMessage()}
		</div>
	);
}
