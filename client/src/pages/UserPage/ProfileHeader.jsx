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
	const [following, setFollowing] = useState(false)
	const avatarUrl = useRef("");

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
					  
				setFollowing(res.data.following)
					
				
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
	const handleLoading = () => {
		setLoaded(true);
	};

	const followUser = async () => {
		const route = following?"unfollow":"follow"
		try {
			await axios({
				method: "PUT",
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				data: {
					targetUser: user,
				},
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/${route}`,
			});
			setFollowing(prev => !prev)
		} catch (error) {
			console.log("Error", error);
		}
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

					{loggedUser?.username !== user && loaded && (
						<button
							className="button profile-header__button"
							onClick={followUser}
						>
							{following?"Deixar de seguir":"Seguir"}
						</button>
					)}
				</div>
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
		</div>
	);
}

const getStyle = (condition) => {
	return condition
		? "profile-header__navbar__link profile-header__navbar__link--active"
		: "profile-header__navbar__link";
};
