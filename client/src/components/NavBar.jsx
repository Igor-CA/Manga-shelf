import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faUserPlus,
	faMagnifyingGlass,
	faRightToBracket,
	faBars,
	faBug,
	faXmark,
	faUser,
	faGear,
	faList,
} from "@fortawesome/free-solid-svg-icons";
import "./NavBar.css";
import { useContext, useState } from "react";
import { UserContext } from "./userProvider";
export default function NavBar() {
	const {user} = useContext(UserContext);
	const [menuVisibility, setMenuVisibility] = useState(false);

	const renderVisitorNavbar = () => {
		return (
			<nav className={`navbar ${menuVisibility ? "visible" : ""}`}>
				<Link
					to={"/info"}
					className="navbar__button"
					onClick={() => {
						setMenuVisibility(false);
					}}
				>
					<FontAwesomeIcon icon={faUserPlus} size="xl" fixedWidth />
					<span className="navbar__label">About</span>
				</Link>

				<Link
					to={"/browse"}
					className="navbar__button"
					onClick={() => {
						setMenuVisibility(false);
					}}
				>
					<FontAwesomeIcon icon={faMagnifyingGlass} size="lg" fixedWidth />
					<span className="navbar__label">Search</span>
				</Link>

				<Link
					to={"/signup"}
					className="navbar__button"
					onClick={() => {
						setMenuVisibility(false);
					}}
				>
					<FontAwesomeIcon icon={faBug} size="lg" fixedWidth />
					<span className="navbar__label">Report </span>
				</Link>

				<Link
					to={"/login"}
					className="navbar__button"
					onClick={() => {
						setMenuVisibility(false);
					}}
				>
					<FontAwesomeIcon icon={faRightToBracket} size="lg" fixedWidth />
					<span className="navbar__label">Log in</span>
				</Link>

				<Link
					to={"/signup"}
					className="navbar__button"
					onClick={() => {
						setMenuVisibility(false);
					}}
				>
					<FontAwesomeIcon icon={faUserPlus} size="lg" fixedWidth />
					<span className="navbar__label">Sign up</span>
				</Link>

				<div
					className="navbar__button"
					onClick={() => {
						setMenuVisibility(false);
					}}
				>
					<FontAwesomeIcon icon={faXmark} size="lg" fixedWidth />
				</div>
			</nav>
		);
	};
	const renderUserNavbar = () => {
		return (
			<nav className={`navbar ${menuVisibility ? "visible" : ""}`}>
				<Link
					to={"/browse"}
					className="navbar__button"
					onClick={() => {
						setMenuVisibility(false);
					}}
				>
					<FontAwesomeIcon icon={faMagnifyingGlass} size="lg" fixedWidth />
					<span className="navbar__label">Search</span>
				</Link>

				<Link
					to={"/report"}
					className="navbar__button"
					onClick={() => {
						setMenuVisibility(false);
					}}
				>
					<FontAwesomeIcon icon={faBug} size="lg" fixedWidth />
					<span className="navbar__label">Report</span>
				</Link>

				<Link
					to={`/user/${user.username}`}
					className="navbar__button"
					onClick={() => {
						setMenuVisibility(false);
					}}
				>
					<FontAwesomeIcon icon={faUser} size="lg" fixedWidth />
					<span className="navbar__label">Profile</span>
				</Link>

				<Link
					to={`/user/${user.username}/missing`}
					className="navbar__button"
					onClick={() => {
						setMenuVisibility(false);
					}}
				>
					<FontAwesomeIcon icon={faList} size="lg" fixedWidth />
					<span className="navbar__label">Missing</span>
				</Link>

				<Link
					to={"/settings"}
					className="navbar__button"
					onClick={() => {
						setMenuVisibility(false);
					}}
				>
					<FontAwesomeIcon icon={faGear} size="lg" fixedWidth />
					<span className="navbar__label">Settings</span>
				</Link>

				<div
					className="navbar__button"
					onClick={() => {
						setMenuVisibility(false);
					}}
				>
					<FontAwesomeIcon icon={faXmark} size="lg" fixedWidth />
				</div>
			</nav>
		);
	};

	return (
		<div className="mobile-menu">
			<div
				className="hamburger"
				style={{ display: menuVisibility ? "none" : "" }}
				onClick={() => {
					setMenuVisibility(true);
				}}
			>
				<FontAwesomeIcon icon={faBars} size="2x" fixedWidth />
			</div>
			{user ? renderUserNavbar() : renderVisitorNavbar()}
		</div>
	);
}
