import axios from "axios";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate, useParams } from "react-router-dom";

export default function ResetPasswordPage() {
	const { userId, token } = useParams();
	const [formData, setFormData] = useState({ email: "" });
	const [errors, setErrors] = useState([]);
	const navigate = useNavigate();

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
				data: { ...formData, userId, token },
				withCredentials: true,
				url: `${process.env.REACT_APP_HOST_ORIGIN}/user/reset-password`,
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

	return (
		<div className="form-container">
			<h1 className="form-title">Set your new password</h1>
			<form
				method="post"
				className="autentication-form"
				onSubmit={(e) => {
					handleSubmit(e);
				}}
			>
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
					Login
				</Link>
				<button className="button">Set new password</button>
			</form>
			{errors.length > 0 && renderErrorsMessage()}
		</div>
	);
}
