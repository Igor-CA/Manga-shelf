import { RiArrowDropDownLine } from "react-icons/ri";
import { useState, useRef, useEffect } from "react";
import "./actionsDropdown.css"

export default function ActionDropdown({
	mainAction,
	options = [],
	isDisabled = false,
}) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef(null);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div className="button-select__shadow-container">
			<div className="button-select__container" ref={dropdownRef}>
				<div
					className={`button-select ${
						mainAction.isRed ? "button-select--red" : ""
					}`}
				>
					<strong
						className="button-select__option"
						onClick={() => !isDisabled && mainAction.onClick()}
					>
						{mainAction.label}
					</strong>

					<div
						className="button-select__dropdown"
						onClick={() => setIsOpen(!isOpen)}
					>
						<RiArrowDropDownLine />
					</div>
				</div>

				<div
					className={`button-select__options-container${
						!isOpen ? "--hidden" : ""
					}`}
				>
					{options.map((option, index) => (
						<label key={index} className="button-select__option">
							<strong>{option.label}</strong>
							<input
								type="checkbox"
								className="checkmark invisible"
								disabled={isDisabled}
								checked={option.checked}
								onChange={(e) => {
									option.onChange(e.target.checked);
									setIsOpen(false);
								}}
							/>
						</label>
					))}
				</div>
			</div>
		</div>
	);
}
