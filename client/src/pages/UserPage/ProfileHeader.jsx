
import { Link } from "react-router-dom";

export default function ProfileHeader({user}) {
	return (
		<header className="profile-header">
            <h1 className="user-name">{user.username}</h1>
            <img src={`${process.env.REACT_APP_HOST_ORIGIN}/images/deffault-profile-picture.webp`} alt="user profile" className="profile-header__picture"></img>
            <nav className="profile-header__navbar">
                <ul className="profile-header__navbar__list">
                    <li><Link to={`/user/${user.username}`} className="profile-header__navbar__link">Estante</Link></li>
                    <li><Link to={`/user/${user.username}/missing`} className="profile-header__navbar__link">Volumes faltosos</Link></li>
                </ul>
            </nav>
		</header>
	);
}
