import { useState } from "react";
import axios from "axios";

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
			console.log(response);
		} catch (error) {
			console.error("Error fetching user Data:", error);
		}
	};

	return (
		<form
			method="post"
			onSubmit={(e) => {
				handleSubmit(e);
			}}
		>
			<label htmlFor="email">
				Email:
				<input
					type="email"
					name="email"
					id="email"
					onChange={(e) => {
						handleChange(e);
					}}
				/>
			</label>
			<label htmlFor="username">
				Nome de usuário:
				<input
					type="text"
					name="username"
					id="username"
					onChange={(e) => {
						handleChange(e);
					}}
				/>
			</label>
			<label htmlFor="password">
				Senha:
				<input
					type="password"
					name="password"
					id="password"
					onChange={(e) => {
						handleChange(e);
					}}
				/>
			</label>
			<button>Signup</button>
		</form>
	);
}
