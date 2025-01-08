import { Link } from "react-router-dom";
import "./UserCard.css";
export default function UserCard({ user }) {
	return (
		<Link
			to={`/user/${user.username}`}
			className="user-card"
			key={user._id}
		>
			<div className="user-card__images-container">
				<div className="user-card__header"></div>
				<img
					src={`${import.meta.env.REACT_APP_HOST_ORIGIN}${
						user.profileImageUrl
							? user.profileImageUrl
							: "/images/deffault-profile-picture.webp"
					}`}
					alt="user profile"
					className="user-card__profile-picture"
				/>
			</div>
			<div className="user-card__username">{user.username}</div>
		</Link>
	);
}
