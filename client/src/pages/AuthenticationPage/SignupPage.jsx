import { useState } from "react";
import axios from "axios";
import "./Authentication.css"

export default function SignupPage() {
	const [formData, setFormData] = useState({
		username: "",
		password: "",
		email: "",
	});

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	const handleSubmit = async (e) => {
		const hostOrigin = process.env.REACT_APP_HOST_ORIGIN;
		e.preventDefault();
		try {
			const response = await axios({
				method: "POST",
				data: formData,
				withCredentials: true,
				url: `${hostOrigin}/user/signup`,
			});
			console.log(response.data);
		} catch (error) {
			console.error("Error fetching user Data:", error);
		}
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
				<label htmlFor="email" className="autentication-form__label">Email:</label>
				<input
					type="email"
					name="email"
					placeholder="Email"
					id="email"
					className="autentication-form__input"
					onChange={(e) => {
						handleChange(e);
					}}
				/>
				<label htmlFor="username" className="autentication-form__label">User name: </label>
				<input
					type="text"
					name="username"
					placeholder="Username"
					id="username"
					className="autentication-form__input"
					onChange={(e) => {
						handleChange(e);
					}}
				/>
				<label htmlFor="password" className="autentication-form__label">Password:</label>
				<input
					type="password"
					name="password"
					placeholder="Password"
					id="password"
					className="autentication-form__input"
					onChange={(e) => {
						handleChange(e);
					}}
				/>
				<label htmlFor="confirm-password" className="autentication-form__label">Confirm password:</label>
				<input
					type="password"
					name="confirm-password"
					placeholder="Confirm password"
					id="confirm-password"
					className="autentication-form__input"
					onChange={(e) => {
						handleChange(e);
					}}
				/>
				<button className="autentication-form__button">Sign up</button>
			</form>
		</div>
	);
}
