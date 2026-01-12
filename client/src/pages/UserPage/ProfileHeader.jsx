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
	const [following, setFollowing] = useState(false);
	const [banner, setBanner] = useState();
	const avatarUrl = useRef("");

	const [cropperAspectRatio, setCropperAspectRatio] = useState(1);
	const [cropperApiRoute, setCropperApiRoute] = useState("");

	useEffect(() => {
		const getProfilePicture = async (page) => {
			setLoaded(false);
			try {
				const res = await axios({
					method: "GET",
					withCredentials: true,
					headers: {
						Authorization: import.meta.env.REACT_APP_API_KEY,
					},
					params: {
						p: page,
					},
					url: `${
						import.meta.env.REACT_APP_HOST_ORIGIN
					}/api/data/get-user-info/${user}`,
				});
				avatarUrl.current = res.data?.profileImageUrl
					? `${import.meta.env.REACT_APP_HOST_ORIGIN}${
							res.data.profileImageUrl
					  }`
					: `${
							import.meta.env.REACT_APP_HOST_ORIGIN
					  }/images/deffault-profile-picture.webp`;

				setFollowing(res.data.following);
				setBanner(res.data.profileBannerUrl);
			} catch (error) {
			} finally {
				setLoaded(true);
			}
		};
		getProfilePicture();
	}, [user]);

	useEffect(() => {
		setActiveLink(location.pathname.replace(`/user/${user}`, ""));
	}, [location, user]);

	const toggleModal = () => {
		setShowModal((prev) => !prev);
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

	const handleLoading = () => {
		setLoaded(true);
	};
	const followUser = async () => {
		try {
			await axios({
				method: "PUT",
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				data: {
					targetUser: user,
					follow: !following,
				},
				url: `${
					import.meta.env.REACT_APP_HOST_ORIGIN
				}/api/user/toggle-follow`,
			});
			setFollowing((prev) => !prev);
		} catch (error) {
			console.log("Error", error);
		}
	};
	return (
		<div>
			{showModal && (
				<ImageModal
					closeModal={toggleModal}
					apiUrl={cropperApiRoute}
					aspectRatio={cropperAspectRatio}
				></ImageModal>
			)}
			<header
				className="profile-header"
				style={
					banner
						? {
								backgroundImage: `url(${
									import.meta.env.REACT_APP_HOST_ORIGIN
								}/${banner})`,
						  }
						: undefined
				}
			>
				<div className="profile-header__shadow"></div>
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
								onClick={() => {
									configureCropToPic();
								}}
							>
								Mudar foto de perfil
							</button>
						)}
					</div>
					<h1 className="user-name">{user}</h1>

					{loggedUser?.username !== user && loaded && (
						<button
							className="button profile-header__button"
							onClick={followUser}
						>
							{following ? "Deixar de seguir" : "Seguir"}
						</button>
					)}
				</div>
				{loggedUser?.username === user && (
					<button
						className="profile-header__change-picture-button"
						onClick={() => {
							configureCropToBanner();
						}}
					>
						Mudar foto de fundo 
					</button>
				)}
			</header>
			<div className="profile-header__navbar">
				<nav className="container">
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
								to={`/user/${user}/volumes`}
								className={getStyle(activeLink === "/volumes")}
							>
								Lista de leitura	
							</Link>
						</li>
						<li>
							<Link
								to={`/user/${user}/wishlist`}
								className={getStyle(activeLink === "/wishlist")}
							>
								Lista de desejos
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
								to={`/user/${user}/gallery`}
								className={getStyle(activeLink === "/gallery")}
							>
								Galeria
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
		</div>
	);
}

const getStyle = (condition) => {
	return condition
		? "profile-header__navbar__link profile-header__navbar__link--active"
		: "profile-header__navbar__link";
};
