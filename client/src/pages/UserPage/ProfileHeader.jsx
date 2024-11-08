import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function ProfileHeader({ user }) {
	const location = useLocation();
	const { username } = user;
	const [activeLink, setActiveLink] = useState(
		location.pathname.replace(`/user/${username}`, "")
	);

	useEffect(() => {
		setActiveLink(location.pathname.replace(`/user/${username}`, ""));
	}, [location]);
	return (
		<div>
			<header className="profile-header">
				<div className="container profile-header__info">
					<img
						src={`/images/deffault-profile-picture.webp`}
						alt="user profile"
						className="profile-header__picture"
					></img>
					<h1 className="user-name">{username}</h1>
					<button className="button profile-header__button">
						Seguir
					</button>
				</div>
			</header>
			<nav className="profile-header__navbar container">
				<ul className="profile-header__navbar__list">
					<li>
						<Link
							to={`/user/${username}`}
							className={getStyle(activeLink === "")}
						>
							Estante
						</Link>
					</li>
					<li>
						<Link
							to={`/user/${username}/missing`}
							className={getStyle(activeLink === "/missing")}
						>
							Volumes faltosos
						</Link>
					</li>
					<li>
						<Link
							to={`/user/${username}/stats`}
							className={getStyle(activeLink === "/stats")}
						>
							Informações
						</Link>
					</li>
					<li>
						<Link
							to={`/user/${username}/socials`}
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
