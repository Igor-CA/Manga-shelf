import "./CustomImputs.css";
export default function CustomToggle({ htmlId, label, checked, handleChange }) {
	return (
		<label htmlFor={htmlId} className="custom-toggle">
			<input
				type="checkbox"
				name={htmlId}
				id={htmlId}
				className="custom-toggle__input"
				checked={checked}
				onChange={handleChange}
			/>
			<span className="custom-toggle__track">
				<span className="custom-toggle__thumb"></span>
			</span>
			{label}
		</label>
	);
}
