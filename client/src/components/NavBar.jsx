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
} from "@fortawesome/free-solid-svg-icons";
import "./NavBar.css";
import { useContext, useState } from "react";
import { UserContext } from "./userProvider";

function NavLink({ to, icon, label }) {
	return (
		<Link to={to} className="navbar__link">
			<FontAwesomeIcon
				icon={icon}
				size="lg"
				fixedWidth
				className="navbar__icon"
			/>
			<span className="navbar__label">{label}</span>
		</Link>
	);
}

export default function NavBar() {
	const { user } = useContext(UserContext);
	const [menuVisibility, setMenuVisibility] = useState(false);
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
				<ul className={`navbar ${menuVisibility ? "mobile--visible" : ""}`}>
					<li className="navbar__button">
						<NavLink
							to={user ? `/user/${user.username}` : "/login"}
							icon={user ? faUser : faRightToBracket}
							label={user ? "Perfil" : "Logar"}
						/>
					</li>
					<li className="navbar__button">
						<NavLink
							to={user ? `/user/${user.username}/missing` : "/signup"}
							icon={user ? faList : faUserPlus}
							label={user ? "Faltando" : "Criar conta"}
						/>
					</li>
					<li className="navbar__button">
						<NavLink to={"/browse"} icon={faMagnifyingGlass} label="Buscar" />
					</li>
					<li className="navbar__button">
						<NavLink to={"/feedback"} icon={faComment} label="Sugestões" />
					</li>
					<li className="navbar__button">
						<NavLink
							to={user ? "/logout" : "/"}
							icon={user ? faRightToBracket : faHouse}
							label={user ? "Sair" : "Início"}
						/>
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
