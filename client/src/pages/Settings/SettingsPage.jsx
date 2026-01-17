import { useContext, useEffect, useState } from "react";
import "../AuthenticationPage/Authentication.css";
import "./Settings.css";
import CustomCheckbox from "../../components/customInputs/CustomCheckbox";
import ImageModal from "../../components/ImageModal";
import { UserContext } from "../../contexts/userProvider";
import axios from "axios";
import { messageContext } from "../../components/messageStateProvider";
import { customWindowConfirm } from "../SeriesPage/utils";
import PromptConfirm from "../../components/PromptConfirm";
import { useNavigate } from "react-router-dom";
import SideNavbar from "../../components/SideNavbar";

const navbarOptions = [
	{
		label: "Conta",
		id: "account",
	},
	{
		label: "Perfil",
		id: "profile",
	},
	{
		label: "Notificações",
		id: "notification",
	},
];
export default function SettingsPage() {
	const { user, isFetching } = useContext(UserContext);
	const navigate = useNavigate();

	useEffect(() => {
		if (!isFetching && !user) {
			navigate("/login");
		}
	}, [isFetching, user, navigate]);

	return (
		<div className="container page-content settings-page">
			{user && (
				<>
					<SideNavbar
						title={"Configurações"}
						options={navbarOptions}
					/>
					<div className="settings-container">
						<AccountSettings />
						<ProfileSettings />
						<NotificationSettings />
					</div>
				</>
			)}
		</div>
	);
}

function AccountSettings() {
	const { addMessage, setMessageType } = useContext(messageContext);
	const { user, setOutdated } = useContext(UserContext);
	const [username, setUserName] = useState("");
	const [nameButtonVisible, setNameButtonVisible] = useState(false);
	const [email, setEmail] = useState("");
	const [emailButtonVisible, setEmailButtonVisible] = useState(false);
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [passwordButtonVisible, setPasswordButtonVisible] = useState(false);
	const [adultAllowed, setadultAllowed] = useState();
	const [url, setUrl] = useState("");
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [confirmationMessage, setConfirmationMessage] = useState("");
	const [onConfirm, setOnConfirm] = useState(null);
	const [onCancel, setOnCancel] = useState(null);

	const setters = [
		setOnConfirm,
		setOnCancel,
		setConfirmationMessage,
		setShowConfirmation,
	];

	useEffect(() => {
		setUserName(user?.username || "");
		setEmail(user?.email || "");
		setadultAllowed(user?.allowAdult);
	}, [user]);
	const handleUserNameChange = (e) => {
		setUserName(e.target.value);
		if (e.target.value.trim() === "") return;
		setNameButtonVisible(true);
	};
	const handleEmailChange = (e) => {
		setEmail(e.target.value);
		if (e.target.value.trim() === "") return;
		setEmailButtonVisible(true);
	};

	const handlePasswordChange = (e) => {
		setPassword(e.target.value);
		if (e.target.value.trim() === "" || confirmPassword.trim() === "")
			return;
		setPasswordButtonVisible(true);
	};
	const handleConfirmPasswordChange = (e) => {
		setConfirmPassword(e.target.value);
		if (e.target.value.trim() === "" || password.trim() === "") return;
		setPasswordButtonVisible(true);
	};

	const handleInvalid = (e) => {
		e.preventDefault();
		const inputName = e.target.name;
		const input = e.target;

		const validationMessages = {
			email: {
				typeMismatch: "O email inserido não é um email válido",
			},
			username: {
				patternMismatch:
					"O nome de usuário não pode ter caracteres especiais (!@#$%^&*) e deve ter entre 3 e 16 caracteres.",
			},
			password: {
				patternMismatch:
					"A senha deve conter pelo menos uma letra, número e caractere especial(!@#$%^&*)",
				tooShort: "A senha precisa de pelo menos 8 caracteres",
			},
			"confirm-password": {
				patternMismatch: "As senhas devem coincidir",
			},
		};

		const validationTypes = ["tooShort", "patternMismatch", "typeMismatch"];
		const inputValidity = validationTypes.find(
			(type) => input.validity[type]
		);

		const customErrorMessage = validationMessages[inputName][inputValidity];

		addMessage(customErrorMessage);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const formData = {
			username,
			email,
			password,
			"confirm-password": confirmPassword,
		};
		try {
			const response = await axios({
				method: "PUT",
				data: formData,
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/${url}`,
			});
			addMessage(response.data.msg);
			setMessageType("Success");
			setOutdated(true);
		} catch (error) {
			const customErrorMessage = error.response.data.msg;
			addMessage(customErrorMessage);
		}
	};

	const handleAdultContent = (e) => {
		const value = e.target.checked;
		if (!value) {
			allowAdult(false);
			return;
		}

		customWindowConfirm(
			setters,
			"Ao permitir a visualização de conteúdo +18 você confirma ter mais de 18 anos e assumir total resposabilidade sobre a visualização destes conteúdos?",
			() => allowAdult(true),
			null
		);
	};

	const allowAdult = async (value) => {
		try {
			const response = await axios({
				method: "PUT",
				data: { allow: value },
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				url: `${
					import.meta.env.REACT_APP_HOST_ORIGIN
				}/api/user/allow-adult`,
			});
			addMessage(response.data.msg);
			setMessageType("Success");
			setOutdated(true);
		} catch (error) {
			const customErrorMessage = error.response.data.msg;
			addMessage(customErrorMessage);
		}
	};

	return (
		<form className="settings-group" onSubmit={handleSubmit}>
			{showConfirmation && (
				<PromptConfirm
					message={confirmationMessage}
					onConfirm={onConfirm}
					onCancel={onCancel}
					hidePrompt={setShowConfirmation}
				></PromptConfirm>
			)}
			<h2 className="settings-group__title" id="account">
				Informações da conta
			</h2>
			<label htmlFor="username" className="input_label">
				<p>Nome de usuário</p>
				<p className="input_obs">
					Obs: Ao mudar o nome de usuario todos os links que levam ao
					seu usuário irão para de funcionar
				</p>
				<input
					placeholder="Novo nome"
					type="text"
					name="username"
					id="username"
					className="input"
					value={username}
					onChange={handleUserNameChange}
					onInvalid={handleInvalid}
					pattern="^[A-Za-z0-9]{3,16}$"
					maxLength="16"
				/>
			</label>
			{nameButtonVisible && (
				<button
					className="button"
					onClick={() => {
						setUrl("set-username");
					}}
				>
					Salvar nome
				</button>
			)}
			<label htmlFor="email" className="input_label">
				Email
				<input
					placeholder="Novo email"
					type="email"
					name="email"
					id="email"
					className="input"
					value={email}
					onChange={handleEmailChange}
					onInvalid={handleInvalid}
				/>
			</label>
			{emailButtonVisible && (
				<button
					className="button"
					onClick={() => {
						setUrl("change-email");
					}}
				>
					Salvar email
				</button>
			)}
			<label htmlFor="password" className="input_label">
				Senha
				<input
					placeholder="Nova senha"
					type="password"
					name="password"
					id="password"
					className="input"
					value={password}
					onChange={handlePasswordChange}
					onInvalid={handleInvalid}
					pattern="^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$"
					minLength="8"
				/>
			</label>
			<label htmlFor="confirm-password" className="input_label">
				Confimar nova senha
				<input
					placeholder="Nova senha"
					type="password"
					name="confirm-password"
					id="confirm-password"
					className="input"
					value={confirmPassword}
					onChange={handleConfirmPasswordChange}
					onInvalid={handleInvalid}
				/>
			</label>
			{passwordButtonVisible && (
				<button
					className="button"
					onClick={() => {
						setUrl("change-password");
					}}
				>
					Salva senha
				</button>
			)}
			{typeof adultAllowed !== "undefined" && (
				<CustomCheckbox
					htmlId={"adult"}
					label={"Permitir conteúdo adulto (+18)"}
					defaultValue={adultAllowed}
					handleChange={handleAdultContent}
				></CustomCheckbox>
			)}
		</form>
	);
}

function ProfileSettings() {
	const [loadedProfile, setLoadedProfile] = useState(false);
	const { user } = useContext(UserContext);
	const [showModal, setShowModal] = useState(false);
	const [cropperAspectRatio, setCropperAspectRatio] = useState(1);
	const [cropperApiRoute, setCropperApiRoute] = useState("");

	const toggleModal = () => {
		setShowModal((prev) => !prev);
	};

	const handleLoadedProfile = () => {
		setLoadedProfile(true);
	};

	const configureCropToPic = () => {
		setCropperAspectRatio(1);
		setCropperApiRoute(
			`${
				import.meta.env.REACT_APP_HOST_ORIGIN
			}/api/user/change-profile-pic`
		);
		toggleModal();
	};
	const configureCropToBanner = () => {
		setCropperAspectRatio(5);
		setCropperApiRoute(
			`${
				import.meta.env.REACT_APP_HOST_ORIGIN
			}/api/user/change-profile-banner`
		);
		toggleModal();
	};
	return (
		<div className="settings-group">
			{showModal && (
				<ImageModal
					closeModal={toggleModal}
					apiUrl={cropperApiRoute}
					aspectRatio={cropperAspectRatio}
				></ImageModal>
			)}

			<h2 className="settings-group__title" id="profile">
				Perfil
			</h2>
			<p className="input_label">Mudar foto de perfil:</p>

			<div className="settings__picture-container">
				<img
					src={`${import.meta.env.REACT_APP_HOST_ORIGIN}${
						user?.profileImageUrl
							? user.profileImageUrl
							: "/images/deffault-profile-picture.webp"
					}`}
					alt="user profile"
					className={`settings__picture ${
						!loadedProfile && "settings__picture--loading"
					}`}
					onLoad={handleLoadedProfile}
				></img>
				<button
					className="settings__change-picture-button"
					onClick={() => {
						configureCropToPic();
					}}
				>
					Clique aqui para selecionar uma nova foto de perfil
				</button>
			</div>
			<p className="input_label">Mudar foto de fundo:</p>
			<div className="settings__picture-container settings__picture-container--banner">
				<div
					className="settings__picture settings__picture--banner"
					style={{
						backgroundImage: `url(${
							import.meta.env.REACT_APP_HOST_ORIGIN
						}/${user?.profileBannerUrl})`,
					}}
				></div>
				<button
					className="settings__change-picture-button"
					onClick={() => {
						configureCropToBanner();
					}}
				>
					Clique aqui para selecionar uma nova foto de fundo
				</button>
			</div>
		</div>
	);
}

function NotificationSettings() {
	const { addMessage, setMessageType } = useContext(messageContext);
	const { user, setOutdated } = useContext(UserContext);
	const [userNotifications, setUserNotification] = useState(
		user?.settings?.notifications
	);

	useEffect(() => {
		setUserNotification(user?.settings?.notifications);
	}, [user]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const form = e.target;
			const formData = new FormData(form);
			const formDataObj = Object.fromEntries(formData.entries());

			await axios({
				method: "PUT",
				withCredentials: true,
				url: `${
					import.meta.env.REACT_APP_HOST_ORIGIN
				}/api/user/set-notifications`,
				data: formDataObj,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
			});
			addMessage("Configurações alteradas com sucesso");
			setMessageType("Success");
			setOutdated(true);
		} catch (error) {
			const customErrorMessage = error.response.data.msg;
			addMessage(customErrorMessage);
		}
	};

	return (
		<form className="settings-group" onSubmit={handleSubmit}>
			{userNotifications && (
				<>
					<h2 className="settings-group__title" id="notification">
						Notificações
					</h2>
					<CustomCheckbox
						htmlId={"enable"}
						label={"Permitir notificaçoes"}
						defaultValue={userNotifications?.allow}
					></CustomCheckbox>
					<CustomCheckbox
						htmlId={"volumes"}
						label={"Notificar novos volumes na sua coleção"}
						defaultValue={userNotifications?.volumes}
					></CustomCheckbox>
					<CustomCheckbox
						htmlId={"followers"}
						label={"Notificar novos seguidores"}
						defaultValue={userNotifications?.followers}
					></CustomCheckbox>
					<CustomCheckbox
						htmlId={"updates"}
						label={"Notificar atualizações no site"}
						defaultValue={userNotifications?.updates}
					></CustomCheckbox>
					<CustomCheckbox
						htmlId={"site-notification"}
						label={"Enviar notificações pelo site"}
						defaultValue={userNotifications?.site}
					></CustomCheckbox>
					<CustomCheckbox
						htmlId={"email-notification"}
						label={"Enviar notificações por email"}
						defaultValue={userNotifications?.email}
					></CustomCheckbox>
					<button className="button">Salvar Configurações</button>
				</>
			)}
		</form>
	);
}
