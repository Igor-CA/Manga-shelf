import { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { FaRegStar, FaStar } from "react-icons/fa";
import { UserContext } from "../../contexts/userProvider";
import { messageContext } from "../../contexts/messageStateProvider";

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

export default function RateButton({ seriesId, volumeId, myScore, isDerived }) {
	const { user, setOutdated } = useContext(UserContext);
	const { addMessage, setMessageType } = useContext(messageContext);
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const ref = useRef(null);

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (ref.current && !ref.current.contains(e.target)) setOpen(false);
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	if (!user) return null;

	const submitScore = async (score) => {
		setOpen(false);
		setLoading(true);
		try {
			await axios({
				method: "POST",
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/rating`,
				data: { seriesId, volumeId: volumeId || undefined, score },
				headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
				withCredentials: true,
			});
			setOutdated(true);
			setMessageType("Success");
			addMessage("Nota salva com sucesso");
		} catch {
			addMessage("Erro ao salvar nota");
		} finally {
			setLoading(false);
		}
	};

	const removeScore = async () => {
		setOpen(false);
		setLoading(true);
		try {
			await axios({
				method: "DELETE",
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/rating`,
				data: { seriesId, volumeId: volumeId || undefined },
				headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
				withCredentials: true,
			});
			setOutdated(true);
			setMessageType("Success");
			addMessage("Nota removida com sucesso");
		} catch {
			addMessage("Erro ao remover nota");
		} finally {
			setLoading(false);
		}
	};

	const hasScore = myScore != null;
	const isManual = hasScore && !isDerived;

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
								onClick={() => submitScore(n)}
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
								onClick={removeScore}
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
