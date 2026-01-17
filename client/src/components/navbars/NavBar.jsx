import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faUserPlus,
	faMagnifyingGlass,
	faRightToBracket,
	faBars,
	faComment,
	faXmark,
	faUser,
	faList,
	faHouse,
	faGear,
	faBell,
} from "@fortawesome/free-solid-svg-icons";
import "./NavBar.css";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../contexts/userProvider";
import { LuMoonStar, LuSunDim } from "react-icons/lu";

function NavLink({ to, icon, label, notification = 0 }) {
	return (
		<Link
			to={to}
			className={`navbar__link ${notification && "navbar__link--active"}`}
		>
			<FontAwesomeIcon
				icon={icon}
				size="lg"
				fixedWidth
				className="navbar__icon"
			/>
			<span
				className={`navbar__label ${
					notification && "navbar__link--active"
				}`}
			>
				{label}{" "}
				{notification > 0 && (
					<div className="navbar__link__count__container">
						<span className="navbar__link__count">
							{notification}
						</span>
					</div>
				)}
			</span>
		</Link>
	);
}

export default function NavBar() {
	const { user } = useContext(UserContext);
	const [menuVisibility, setMenuVisibility] = useState(false);
	const [theme, setTheme] = useState(
		localStorage.theme ? localStorage.theme : "light"
	);
	useEffect(() => {
		if (theme === "light") {
			document.body.classList = "light";
			localStorage.theme = "light";
		} else {
			document.body.classList = "dark";
			localStorage.theme = "dark";
		}
	}, [theme]);

	const toggleTheme = () => {
		if (theme === "light") {
			setTheme("dark");
		} else {
			setTheme("light");
		}
	};
	return (
		<div className="menu">
			{/*This div appears only when on mobile devices */}
			{/*Is just the hamburguer menu*/}
			<div
				className="mobile_menu navbar__icon"
				style={{ display: menuVisibility ? "none" : "" }}
				onClick={() => {
					setMenuVisibility(true);
				}}
			>
				<FontAwesomeIcon icon={faBars} size="2x" fixedWidth />
			</div>

			<nav
				onClick={() => {
					setMenuVisibility(false);
				}}
			>
				<ul
					className={`navbar ${
						menuVisibility ? "mobile--visible" : ""
					}`}
				>
					<li className="navbar__button">
						<NavLink
							to={user ? `/user/${user.username}` : "/login"}
							icon={user ? faUser : faRightToBracket}
							label={user ? "Perfil" : "Logar"}
						/>
					</li>
					<li className="navbar__button">
						<NavLink
							to={
								user
									? `/user/${user.username}/missing`
									: "/signup"
							}
							icon={user ? faList : faUserPlus}
							label={user ? "Faltando" : "Criar conta"}
						/>
					</li>
					<li className="navbar__button">
						<NavLink
							to={"/browse"}
							icon={faMagnifyingGlass}
							label="Buscar"
						/>
					</li>
					<li className="navbar__button">
						<NavLink
							to={"/feedback"}
							icon={faComment}
							label="Sugestões"
						/>
					</li>

					{user && (
						<li className="navbar__button">
							<NavLink
								to={"/settings"}
								icon={faGear}
								label="Configurações"
							/>
						</li>
					)}
					{user && (
						<li className="navbar__button">
							<NavLink
								to={"/notifications"}
								icon={faBell}
								label="Notificações"
								notification={user?.notificationCount}
							/>
						</li>
					)}
					<li
						className="navbar__button navbar__button--theme"
						onClick={toggleTheme}
					>
						{theme === "light" ? (
							<LuMoonStar className="navbar__icon--theme" />
						) : (
							<LuSunDim className="navbar__icon--theme" />
						)}
						<span className="navbar__label navbar__label--theme">
							{theme === "light" ? "Tema escuro" : "Tema claro"}
						</span>
					</li>
					{/*Close icon that appears only when on mobile device*/}
					<li className="navbar__button navbar__icon">
						<FontAwesomeIcon icon={faXmark} size="lg" fixedWidth />
					</li>
				</ul>
			</nav>
		</div>
	);
}
