import { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ImageModal from "../../components/ImageModal";
import axios from "axios";
import { UserContext } from "../../components/userProvider";

export default function ProfileHeader({ user }) {
	const [loaded, setLoaded] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const location = useLocation();
	const { user: loggedUser } = useContext(UserContext);
	const [activeLink, setActiveLink] = useState(
		location.pathname.replace(`/user/${user}`, "")
	);
	const avatarUrl = useRef("");

	useEffect(() => {
		const getProfilePicture = async (page) => {
			try {
				const res = await axios({
					method: "GET",
					withCredentials: true,
					headers: {
						Authorization: process.env.REACT_APP_API_KEY,
					},
					params: {
						p: page,
					},
					url: `/api/data/get-user-info/${user}`,
				});
				avatarUrl.current = res.data?.profileImageUrl
					? res.data.profileImageUrl
					: "/images/deffault-profile-picture.webp";
			} catch (error) {}
		};
		getProfilePicture();
		console.log("user")
	},[user]);

	useEffect(() => {
		setActiveLink(location.pathname.replace(`/user/${user}`, ""));
	}, [location, user]);

	const toggleModal = () => {
		setShowModal((prev) => !prev);
	};
	const handleLoading = () => {
		setLoaded(true);
	};
	return (
		<div>
			{showModal && <ImageModal closeModal={toggleModal}></ImageModal>}
			<header className="profile-header">
				<div className="container profile-header__info">
					<div className="profile-header__picture-container">
						<img
							src={avatarUrl.current}
							alt="user profile"
							className={`profile-header__picture ${
								!loaded && "profile-header__picture--loading"
							}`}
							onLoad={handleLoading}
						></img>
						{loggedUser?.username === user && (
							<button
								className="profile-header__change-picture-button"
								onClick={toggleModal}
							>
								Mudar foto de perfil
							</button>
						)}
					</div>
					<h1 className="user-name">{user}</h1>

					<button className="button profile-header__button">
						Seguir
					</button>
				</div>
			</header>
			<nav className="profile-header__navbar container">
				<ul className="profile-header__navbar__list">
					<li>
						<Link
							to={`/user/${user}`}
							className={getStyle(activeLink === "")}
						>
							Estante
						</Link>
					</li>
					<li>
						<Link
							to={`/user/${user}/missing`}
							className={getStyle(activeLink === "/missing")}
						>
							Volumes faltosos
						</Link>
					</li>
					<li>
						<Link
							to={`/user/${user}/stats`}
							className={getStyle(activeLink === "/stats")}
						>
							Informações
						</Link>
					</li>
					<li>
						<Link
							to={`/user/${user}/socials`}
							className={getStyle(activeLink === "/socials")}
						>
							Social
						</Link>
					</li>
				</ul>
			</nav>
		</div>
	);
}

const getStyle = (condition) => {
	return condition
		? "profile-header__navbar__link profile-header__navbar__link--active"
		: "profile-header__navbar__link";
};
