import { useContext, useEffect, useRef, useState, useMemo } from "react";
import ImageModal from "../../components/ImageModal";
import ContentNavbar from "../../components/contentNavbar/ContentNavbar";
import axios from "axios";
import { UserContext } from "../../components/userProvider";

export default function ProfileHeader({ user }) {
	const [loaded, setLoaded] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const { user: loggedUser } = useContext(UserContext);

	const [following, setFollowing] = useState(false);
	const [banner, setBanner] = useState();
	const avatarUrl = useRef("");

	const [cropperAspectRatio, setCropperAspectRatio] = useState(1);
	const [cropperApiRoute, setCropperApiRoute] = useState("");

	const navLinks = useMemo(
		() => [
			{ to: `/user/${user}`, label: "Estante", end: true },
			{ to: `/user/${user}/missing`, label: "Volumes faltosos" },
			{ to: `/user/${user}/volumes`, label: "Lista de leitura" },
			{ to: `/user/${user}/wishlist`, label: "Lista de desejos" },
			{ to: `/user/${user}/stats`, label: "Informações" },
			{ to: `/user/${user}/socials`, label: "Social" },
		],
		[user]
	);

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
					params: { p: page },
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
				// Handle error
			} finally {
				setLoaded(true);
			}
		};
		getProfilePicture();
	}, [user]);

	const toggleModal = () => setShowModal((prev) => !prev);

	const configureCropToPic = () => {
		setCropperAspectRatio(1);
		setCropperApiRoute(
			`${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/change-profile-pic`
		);
		toggleModal();
	};

	const configureCropToBanner = () => {
		setCropperAspectRatio(5);
		setCropperApiRoute(
			`${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/change-profile-banner`
		);
		toggleModal();
	};

	const handleLoading = () => setLoaded(true);

	const followUser = async () => {
		try {
			await axios({
				method: "PUT",
				withCredentials: true,
				headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
				data: { targetUser: user, follow: !following },
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/toggle-follow`,
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
				/>
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
						/>
						{loggedUser?.username === user && (
							<button
								className="profile-header__change-picture-button"
								onClick={configureCropToPic}
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
						onClick={configureCropToBanner}
					>
						Mudar foto de fundo
					</button>
				)}
			</header>

			<ContentNavbar links={navLinks} />
		</div>
	);
}
