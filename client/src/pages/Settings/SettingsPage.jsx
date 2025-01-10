import { useContext, useState } from "react";
import "../AuthenticationPage/Authentication.css";
import "./Settings.css";
import CustomCheckbox from "../../components/CustomCheckbox";
import useActiveHeader from "../../utils/useActiveHeading";
import ImageModal from "../../components/ImageModal";
import { UserContext } from "../../components/userProvider";
export default function SettingsPage() {
	return (
		<div className="container page-content settings-page">
			<NavBar />

			<div className="settings-container">
				<AccountSettings />
				<ProfileSettings />
				<NotificationSettings />
			</div>
		</div>
	);
}

function NavBar() {
	const activeId = useActiveHeader();

	const handleClick = (e, id) => {
		e.preventDefault();
		document.querySelector(`#${id}`).scrollIntoView({
			behavior: "smooth",
		});
	};

	const getStyle = (activeId, id) => {
		const activeStyle = "settings__navbar__link settings__navbar__link--active";
		const inactiveStyle = "settings__navbar__link";
		return activeId === id ? activeStyle : inactiveStyle;
	};

	return (
		<aside className="settings__aside">
			<section className="settings__navbar-container">
				<p className="settings__navbar-title">Configurações</p>
				<nav>
					<ul>
						<li className="settings__navbar-item">
							<a
								className={getStyle(activeId, "account")}
								href="#account"
								onClick={(e) => {
									handleClick(e, "account");
								}}
							>
								Conta
							</a>
						</li>
						<li className="settings__navbar-item">
							<a
								className={getStyle(activeId, "profile")}
								href={"profile"}
								onClick={(e) => {
									handleClick(e, "profile");
								}}
							>
								Perfil
							</a>
						</li>
						<li className="settings__navbar-item">
							<a
								className={getStyle(activeId, "notification")}
								href={"notification"}
								onClick={(e) => {
									handleClick(e, "notification");
								}}
							>
								Notificações
							</a>
						</li>
					</ul>
				</nav>
			</section>
		</aside>
	);
}

function AccountSettings() {
	return (
		<div className="settings-group">
			<h2 className="settings-group__title" id="account">
				Informações da conta
			</h2>
			<label htmlFor="username" className="input_label">
				<p>Nome de usuário</p>
				<p className="input_obs">
					Obs: Ao mudar o nome de usuario todos os links que levam ao seu
					usuário irão para de funcionar
				</p>
				<input
					placeholder="Novo nome"
					type="text"
					name="username"
					id="username"
					className="input"
				/>
			</label>
			<label htmlFor="password" className="input_label">
				Senha
				<input
					placeholder="Nova senha"
					type="password"
					name="password"
					id="password"
					className="input"
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
				/>
			</label>
			<label htmlFor="email" className="input_label">
				Email
				<input
					placeholder="Novo email"
					type="email"
					name="email"
					id="email"
					className="input"
				/>
			</label>
			<CustomCheckbox
				htmlId={"adult"}
				label={"Permitir conteúdo adulto (+18)"}
			></CustomCheckbox>
		</div>
	);
}

function ProfileSettings() {
	const [loadedProfile, setLoadedProfile] = useState(false);
	const [loadedBanner, setLoadedBanner] = useState(false);
	const { user } = useContext(UserContext);
	const [showModal, setShowModal] = useState(false);

	const toggleModal = () => {
		setShowModal((prev) => !prev);
	};

	const handleLoadedProfile = () => {
		setLoadedProfile(true);
	};
	const handleLoadedBanner = () => {
		setLoadedBanner(true);
	};
	return (
		<div className="settings-group">
			{showModal && (
				<ImageModal
					closeModal={toggleModal}
					apiUrl={`${
						import.meta.env.REACT_APP_HOST_ORIGIN
					}/api/user/change-profile-pic`}
					aspectRatio={1}
				></ImageModal>
			)}

			<h2 className="settings-group__title" id="profile">
				Perfil
			</h2>
			<p className="input_label">Mudar foto de perfil:</p>
			<div className="settings__picture-container">
				<img
					src={`http://localhost:3001${
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
					onClick={toggleModal}
				>
					Clique aqui para selecionar uma nova foto de perfil
				</button>
			</div>
			<p className="input_label">Mudar foto de fundo:</p>
			<div className="settings__picture-container settings__picture-container--banner">
				<img
					src=""
					alt="Imagem de fundo do perfil"
					className={`settings__picture ${
						!loadedBanner && "settings__picture--loading"
					}`}
					onLoad={handleLoadedBanner}
				></img>
				<button
					className="settings__change-picture-button"
					/*onClick={toggleModal}*/
				>
					Clique aqui para selecionar uma nova foto de fundo
				</button>
			</div>
		</div>
	);
}

function NotificationSettings() {
	return (
		<div className="settings-group">
			<h2 className="settings-group__title" id="notification">
				Notificações
			</h2>
			<CustomCheckbox
				htmlId={"enable"}
				label={"Permitir notificaçoes"}
			></CustomCheckbox>
			<CustomCheckbox
				htmlId={"volumes"}
				label={"Notificar novos volumes na sua coleção"}
			></CustomCheckbox>
			<CustomCheckbox
				htmlId={"followers"}
				label={"Notificar novos seguidores"}
			></CustomCheckbox>
			<CustomCheckbox
				htmlId={"updates"}
				label={"Notificar atualizações no site"}
			></CustomCheckbox>
			<CustomCheckbox
				htmlId={"email-notification"}
				label={"Enviar notificações por email"}
			></CustomCheckbox>
			<CustomCheckbox
				htmlId={"site-notification"}
				label={"Enviar notificações pelo site"}
			></CustomCheckbox>
		</div>
	);
}
