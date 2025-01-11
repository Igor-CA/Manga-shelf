import "./CustomImputs.css"
export default function CustomCheckbox({ htmlId, label, defaultValue = true }) {
	return (
		<label htmlFor={htmlId} className="input_label custom-checkbox">
			<input
				type="checkbox"
				name={htmlId}
				id={htmlId}
				className="input--checkbox"
				defaultChecked={defaultValue}
			/>
			<div className="checkbox-wrapper">
				<div className="checkbox-bg"></div>
				<svg fill="none" viewBox="0 0 24 24" className="checkbox-icon">
					<path
						strokeLinejoin="round"
						strokeLinecap="round"
						strokeWidth="3"
						stroke="currentColor"
						d="M4 12L10 18L20 6"
						className="check-path"
					></path>
				</svg>
			</div>
			{label}
		</label>
	);
}
