import axios from "axios";
import { useContext, useState } from "react";
import { messageContext } from "../../components/messageStateProvider";
import { UserContext } from "../../contexts/userProvider";

import "./Authentication.css";

export default function UserNameModal() {
	const { setOutdated } = useContext(UserContext);
	const [formData, setFormData] = useState();
	const { addMessage, setMessageType } = useContext(messageContext);
	const [loading, setLoading] = useState(false);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			setLoading(true);
			await axios({
				method: "PUT",
				data: formData,
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/set-username`,
			});
			addMessage("Seu nome de usuário foi atualizado com sucesso");
			setMessageType("Success");
			setOutdated(true);
			window.location.href = "/";
			setLoading(false);
		} catch (error) {
			const customErrorMessage = error.response.data.msg;
			addMessage(customErrorMessage);
			setLoading(false);
		}
	};

	const handleInvalid = (e) => {
		e.preventDefault();
		const inputName = e.target.name;
		const input = e.target;

		const validationMessages = {
			username: {
				valueMissing: "É obrigatório informar um nome de usuário",
				patternMismatch:
					"O nome de usuário não pode ter caracteres especiais (!@#$%^&*) e deve ter entre 3 e 16 caracteres.",
			},
		};

		const validationTypes = ["patternMismatch", "valueMissing"];
		const inputValidity = validationTypes.find((type) => input.validity[type]);

		const customErrorMessage = validationMessages[inputName][inputValidity];

		addMessage(customErrorMessage);
	};

	return (
		<div className="page-content--modal">
			<div className="form-container">
				<h1 className="form-title">
					Bem vindo ao Mangashelf! <br />
					<br />
					Informe seu nome de usuário
				</h1>
				<p>
					Obs: Sua senha também ainda não foi configurada mas ainda é possível
					entrar na sua conta com google. Caso queira basta configurar a senha
					na área de configurações. Do contrário só será possivel logar na sua
					conta via google.
				</p>
				<form
					method="post"
					className="autentication-form"
					onSubmit={(e) => {
						handleSubmit(e);
					}}
				>
					<label htmlFor="username" className="autentication-form__label">
						User name:{" "}
					</label>
					<input
						type="text"
						name="username"
						placeholder="Nome de usuário"
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
					<button
						className={`button ${loading ? "button--disabled" : ""}`}
						disabled={loading}
					>
						Salvar
					</button>
				</form>
			</div>
		</div>
	);
}
