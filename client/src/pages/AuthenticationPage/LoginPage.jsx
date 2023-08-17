import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "../../components/userProvider";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
	//const hostOrigin = process.env.REACT_APP_HOST_ORIGIN
    const navigate = useNavigate();
	const [formData, setFormData] = useState({ login: "", password: "" });
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
		const userFetch = await axios({
			method: "GET",
			withCredentials: true,
			url: "http://localhost:3001/user/profile",
		});
		setUser(userFetch.data);
		console.log(response);
		console.log(userFetch.data);
		navigate("../");
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
