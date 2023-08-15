import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "../../components/userProvider";

export default function LoginPage() {
	//const hostOrigin = process.env.REACT_APP_HOST_ORIGIN
	const [formData, setFormData] = useState({ username: "", password: "" });
	const [user, setUser] = useContext(UserContext);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const response = await axios({
			method: "POST",
			data: formData,
			withCredentials: true,
			url: "http://localhost:3001/user/login",
		});
		console.log(response);
		setUser(); //Update state and the parent will handle the querry
	};

	return (
		<div>
			{user ? <h1>Welcome {user.username}</h1> : ""}
			<form
				action="/login"
				method="post"
				onSubmit={(e) => {
					handleSubmit(e);
				}}
			>
				<label htmlFor="login">
					Nome de usuário:
					<input
						type="text"
						name="login"
						id="login"
						value={formData.login}
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
						value={formData.password}
						onChange={(e) => {
							handleChange(e);
						}}
					/>
				</label>
				<button>Log in</button>
			</form>
		</div>
	);
}
