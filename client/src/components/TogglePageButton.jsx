import { Link, useLocation, useNavigate } from "react-router-dom";
import { RiArrowDropDownLine } from "react-icons/ri";

import "./TogglePageButton.css";
import { useState } from "react";
export default function TogglePageButton() {
	const [optionsVisible, setOptionsVisible] = useState(false);
	const page = useLocation().pathname === "/browse/user" ? "user" : "series";

	const handleClick = () => {
		setOptionsVisible((prev) => !prev);
	};
	return (
		<div className="toggle-page__container">
			<div className="toggle-page__label">Buscar por:</div>
			<div className="toggle-page__input">
				<div className="toggle-page__input__selected" onClick={handleClick}>
					{page === "series" ? "Obra" : "Usuário"} <RiArrowDropDownLine />
				</div>

				<div className={`toggle-page__options-container ${optionsVisible?"":"toggle-page__options-container--hidden"}`}>
					<Link to={"/browse"} className="toggle-page__option">
						Obra
					</Link>
					<Link to={"/browse/user"} className="toggle-page__option">
						Usuário
					</Link>
				</div>
			</div>
		</div>
	);
}
