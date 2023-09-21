import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import { useState } from "react";

export default function ReportProblem() {
	const [formData, setFormData] = useState({
		type: "",
		local: "",
		details: "",
		page: "",
		user: "",
	});
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
				data: { ...formData },
				withCredentials: true,
				url: `${process.env.REACT_APP_HOST_ORIGIN}/user/report`,
			});
			setFormData(({
				type: "",
				local: "",
				details: "",
				page: "",
				user: "",
			}))
			//TODO change to make a success message instead 
			const customErrorMessage = response.data.message;
			setErrors((prevErrors) => [...prevErrors, customErrorMessage]);

			setTimeout(() => {
				setErrors([]);
			}, 5000);

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
		<div className="page-content">
			<div className="form-container">
				<h1 className="form-title">Reporte um problema</h1>
				<form
					method="post"
					className="autentication-form"
					onSubmit={(e) => {
						handleSubmit(e);
					}}
				>
					<label
						htmlFor="type"
						className="autentication-form__label form__label--visible"
					>
						Tipo de problema:
					</label>
					<select
						name="type"
						id="type"
						className="autentication-form__input"
						onChange={(e) => {
							handleChange(e);
						}}
						onInvalid={(e) => {
							handleInvalid(e);
						}}
						required
						defaultValue={""}
					>
						<option value="" disabled>
							Escolha o tipo de problema
						</option>
						<option value="Wrong info">Informação errada</option>
						<option value="Missing info">Informação faltando</option>
						<option value="Bug">Ocorrencia de problemas/bugs</option>
						<option value="Change suggestion">Sugestão de mudança</option>
						<option value="New feature">Sugestão de nova função</option>
						<option value="Other">Outro</option>
					</select>
					<label
						htmlFor="local"
						className="autentication-form__label form__label--visible"
					>
						Página do problema:
					</label>
					<select
						name="local"
						id="local"
						className="autentication-form__input"
						onChange={(e) => {
							handleChange(e);
						}}
						onInvalid={(e) => {
							handleInvalid(e);
						}}
						required
						defaultValue={""}
					>
						<option value="" disabled>
							Escolha onde ocorreu o problema
						</option>
						<option value="User profile">Perfis de usuário</option>
						<option value="Missing volumes">Página de Volumes faltosos</option>
						<option value="Volumes page">Página de um Volume</option>
						<option value="Series page">Página de uma coleção</option>
						<option value="Search page">Pagina de busca</option>
						<option value="Search result">Resultado em busca</option>
						<option value="Authentication">Login/Cadastro</option>
						<option value="Other">Outro</option>
					</select>
					<label
						htmlFor="details"
						className="autentication-form__label form__label--visible"
					>
						Detalhe o problema:
					</label>
					<textarea
						placeholder="Ex: O volume 10 de My hero academia está sem uma sinópse.&#10;Ex 2: Sem querer removi uma colecção da minha lista e quando adicionei novamente a coleção aparecia duas vezes"
						name="details"
						id="details"
						rows={5}
						value={formData.details}
						onChange={(e) => {
							handleChange(e);
						}}
						onInvalid={(e) => {
							handleInvalid(e);
						}}
						required
						className="autentication-form__input"
					></textarea>
					<label
						htmlFor="page"
						className="autentication-form__label form__label--visible"
					>
						Link ou pagina onde ocorreu:
					</label>
					<input
						type="text"
						name="page"
						id="page"
						placeholder="Ex: Volume 10 de My Hero Academia"
						className="autentication-form__input"
						value={formData.page}
						onChange={(e) => {
							handleChange(e);
						}}
						onInvalid={(e) => {
							handleInvalid(e);
						}}
								required
					/>
					<label
						htmlFor="user"
						className="autentication-form__label form__label--visible"
					>
						Seu usuário:
					</label>
					<input
						type="text"
						name="user"
						id="user"
						placeholder="Seu Usuário ou email"
						className="autentication-form__input"
						value={formData.user}
						onChange={(e) => {
							handleChange(e);
						}}
						onInvalid={(e) => {
							handleInvalid(e);
						}}
					/>
					<button className="button">Send Report</button>
				</form>
				{errors.length > 0 && renderErrorsMessage()}
			</div>
		</div>
	);
}
