import { useContext, useEffect, useRef, useState } from "react";
import { FaRegStar, FaStar } from "react-icons/fa";
import { UserContext } from "../../contexts/userProvider";

const SCORE_LABELS = {
	10: "Obra-prima",
	9: "Excelente",
	8: "Muito bom",
	7: "Bom",
	6: "Razoável",
	5: "Mediano",
	4: "Ruim",
	3: "Muito ruim",
	2: "Horrível",
	1: "Péssimo",
};

export default function RateButton({ myScore, isDerived, loading, onSubmit, onRemove }) {
	const { user } = useContext(UserContext);
	const [open, setOpen] = useState(false);
	const ref = useRef(null);

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (ref.current && !ref.current.contains(e.target)) setOpen(false);
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	if (!user) return null;

	const hasScore = myScore != null;
	const isManual = hasScore && !isDerived;

	const handleSelect = (n) => {
		setOpen(false);
		onSubmit(n);
	};

	const handleRemove = () => {
		setOpen(false);
		onRemove();
	};

	return (
		<div className="rate-button__wrap" ref={ref}>
			<button
				type="button"
				className={`rate-button${isManual ? " rate-button--rated" : ""}`}
				onClick={() => !loading && setOpen((v) => !v)}
				disabled={loading}
				aria-haspopup="listbox"
				aria-expanded={open}
				title={
					hasScore
						? `Sua nota: ${myScore}${isDerived ? " (média dos volumes)" : ""}`
						: "Avaliar"
				}
			>
				{hasScore ? (
					<>
						<FaStar aria-hidden="true" />
						<span className="rate-button__value">{myScore}</span>
					</>
				) : (
					<FaRegStar aria-hidden="true" />
				)}
			</button>

			{open && (
				<ul className="rate-button__menu" role="listbox">
					{[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
						<li key={n} role="option" aria-selected={myScore === n}>
							<button
								type="button"
								className={`rate-button__menu-item${
									myScore === n ? " rate-button__menu-item--active" : ""
								}`}
								onClick={() => handleSelect(n)}
							>
								<span className="rate-button__menu-score">({n})</span>
								<span className="rate-button__menu-label">
									{SCORE_LABELS[n]}
								</span>
							</button>
						</li>
					))}
					{isManual && (
						<li>
							<button
								type="button"
								className="rate-button__menu-item rate-button__menu-item--remove"
								onClick={handleRemove}
							>
								Remover nota
							</button>
						</li>
					)}
				</ul>
			)}
		</div>
	);
}
