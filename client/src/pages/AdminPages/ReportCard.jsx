import { useContext } from "react";
import axios from "axios";
import "./ReportCard.css";
import { messageContext } from "../../contexts/messageStateProvider";

const REASON_LABELS = {
	hate: "Ódio ou discurso abusivo",
	adult: "Conteúdo adulto não classificado",
	spoiler: "Spoiler não marcado",
};

export default function ReportCard({ report, onProcess }) {
	const { addMessage } = useContext(messageContext);

	const handleAction = async (action) => {
		try {
			const endpoint =
				action === "delete"
					? `${import.meta.env.REACT_APP_HOST_ORIGIN}/admin/report/${report._id}/delete-post`
					: `${import.meta.env.REACT_APP_HOST_ORIGIN}/admin/report/${report._id}/restore`;

			const response = await axios.post(
				endpoint,
				{},
				{
					withCredentials: true,
					headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
				},
			);
			addMessage(response.data?.msg, "Success");
			onProcess(report._id);
		} catch (err) {
			addMessage(`Erro ao processar: ${err?.response?.data?.msg}`);
		}
	};

	return (
		<div className="report-card">
			<h3>Denúncia: {REASON_LABELS[report.reason] || report.reason}</h3>
			<span>
				<strong>Denunciante:</strong>{" "}
				{report.reporter?.username || report.reporter}
			</span>
			<span>
				<strong>Autor do comentário:</strong>{" "}
				{report.post?.author?.username || report.post?.author}
			</span>
			<div>
				<strong>Texto denunciado:</strong>
				<p className="report-card__text">{report.reportedText}</p>
			</div>
			<div className="buttons-container">
				<button
					className="button button--green button--grow"
					onClick={() => handleAction("restore")}
				>
					Restaurar
				</button>
				<button
					className="button button--red button--grow"
					onClick={() => handleAction("delete")}
				>
					Excluir
				</button>
			</div>
		</div>
	);
}
