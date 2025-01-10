import { Link } from "react-router-dom";
import "./UserCard.css";
import { useState } from "react";
export default function UserCard({ user }) {
	const [loaded, setLoaded] = useState(false);
	const handleLoading = () => {
		setLoaded(true);
	};
	return (
		<Link to={`/user/${user.username}`} key={user._id}>
			<div className="user-card__images-container">
				<div
					className="user-card__header"
					style={
						user.profileBannerUrl
							? { backgroundImage: `url(${import.meta.env.REACT_APP_HOST_ORIGIN}/${user.profileBannerUrl})` }
							: undefined
					}
				></div>
				<div className="user-card__picture-container">
					<img
						src={`${import.meta.env.REACT_APP_HOST_ORIGIN}${
							user.profileImageUrl
								? user.profileImageUrl
								: "/images/deffault-profile-picture.webp"
						}`}
						loading="lazy"
						onLoad={handleLoading}
						alt="user profile"
						className={`user-card__profile-picture ${
							!loaded && "profile-header__picture--loading"
						}`}
					/>
				</div>
			</div>
			<div className="user-card__username">{user.username}</div>
		</Link>
	);
}
