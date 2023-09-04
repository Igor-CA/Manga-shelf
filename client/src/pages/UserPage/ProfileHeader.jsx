export default function ProfileHeader({user}) {
	return (
		<header className="profile-header">
            <img src={`${process.env.REACT_APP_HOST_ORIGIN}/images/deffault-profile-picture.webp`} alt="user profile" className="profile-header__picture"></img>
            <h1 className="user-name">{user.username}</h1>
            <nav className="profile-header__navbar">
                <ul className="profile-header__navbar__list">
                    <li><a href={`./${user.username}`} className="profile-header__navbar__link">Collection</a></li>
                    <li><a href={`./${user.username}/missing`} className="profile-header__navbar__link">Missing page</a></li>
                </ul>
            </nav>
		</header>
	);
}
