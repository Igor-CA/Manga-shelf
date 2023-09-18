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
	faHouse,
} from "@fortawesome/free-solid-svg-icons";
import "./NavBar.css";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "./userProvider";
export default function NavBar() {
	const { user } = useContext(UserContext);
	const [menuVisibility, setMenuVisibility] = useState(false);
	const [onMobile, setOnMobile] = useState(false);

	useEffect(() => {
		const handleResize = () => {
			setOnMobile( window.matchMedia("(max-width: 1040px)").matches);
		};
		handleResize();
		window.addEventListener("resize", handleResize);

		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return (
		<div className={onMobile ? "mobile-menu" : "menu"}>
			{onMobile && (
				<div
					className="hamburger"
					style={{ display: menuVisibility ? "none" : "" }}
					onClick={() => {
						setMenuVisibility(true);
					}}
				>
					<FontAwesomeIcon icon={faBars} size="2x" fixedWidth />
				</div>
			)}

			<nav>
				<ul
					className={`navbar ${menuVisibility || !onMobile ? "visible" : ""}`}
				>
					<li className="navbar__button">
						<Link
							to={user ? `/user/${user.username}` : "/login"}
							onClick={() => {
								setMenuVisibility(false);
							}}
						>
							{onMobile && (
								<FontAwesomeIcon
									icon={user ? faUser : faRightToBracket}
									size="lg"
									fixedWidth
								/>
							)}
							<span className="navbar__label">
								{user ? "Profile" : "Log in"}
							</span>
						</Link>
					</li>
					<li className="navbar__button">
						<Link
							to={user ? `/user/${user.username}/missing` : "/signup"}
							onClick={() => {
								setMenuVisibility(false);
							}}
						>
							{onMobile && (
								<FontAwesomeIcon
									icon={user ? faList : faUserPlus}
									size="lg"
									fixedWidth
								/>
							)}
							<span className="navbar__label">
								{user ? "Missing" : "Sign up"}
							</span>
						</Link>
					</li>
					<Link
						to={"/browse"}
						className="navbar__button"
						onClick={() => {
							setMenuVisibility(false);
						}}
					>
						{onMobile && (
							<FontAwesomeIcon icon={faMagnifyingGlass} size="lg" fixedWidth />
						)}
						<span className="navbar__label">Search</span>
					</Link>

					<Link
						to={"/report"}
						className="navbar__button"
						onClick={() => {
							setMenuVisibility(false);
						}}
					>
						{onMobile && <FontAwesomeIcon icon={faBug} size="lg" fixedWidth />}
						<span className="navbar__label">Report</span>
					</Link>

					<li className="navbar__button">
						<Link
							to={user ? "/settings" : "/"}
							onClick={() => {
								setMenuVisibility(false);
							}}
						>
							{onMobile && (
								<FontAwesomeIcon
									icon={user ? faGear : faHouse}
									size="lg"
									fixedWidth
								/>
							)}
							<span className="navbar__label">
								{user ? "Settings" : "Home"}
							</span>
						</Link>
					</li>

					{onMobile && (
						<li
							className="navbar__button"
							onClick={() => {
								setMenuVisibility(false);
							}}
						>
							<FontAwesomeIcon icon={faXmark} size="lg" fixedWidth />
						</li>
					)}
				</ul>
			</nav>
		</div>
	);
}
