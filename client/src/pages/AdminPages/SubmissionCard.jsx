import { useContext, useState } from "react";
import axios from "axios";
import "./SubmissionCard.css";
import { getValueByPath } from "../../utils/seriesDataFunctions";
import { messageContext } from "../../contexts/messageStateProvider";

const flattenObject = (obj, prefix = "") => {
	return Object.keys(obj).reduce((acc, k) => {
		const pre = prefix.length ? prefix + "." : "";
		if (
			typeof obj[k] === "object" &&
			obj[k] !== null &&
			!Array.isArray(obj[k])
		) {
			Object.assign(acc, flattenObject(obj[k], pre + k));
		} else {
			acc[pre + k] = obj[k];
		}
		return acc;
	}, {});
};

export default function SubmissionCard({ submission, onProcess }) {
	const [comment, setComment] = useState("Muito obrigado!");
	const { addMessage, setMessageType } = useContext(messageContext);

	const changes = flattenObject(submission.payload);
	const originalData = submission.targetId || {};

	const formatValue = (val) => {
		if (val === undefined || val === null)
			return <span className="empty-val">Empty</span>;
		if (typeof val === "boolean") return val ? "Sim" : "Não";
		if (Array.isArray(val)) return val.join(", ");
		if (typeof val === "string" && val.match(/^\d{4}-\d{2}-\d{2}/)) {
			return val.split("T")[0];
		}
		return String(val);
	};

	const handleAction = async (status) => {
		try {
			const endpoint =
				status === "Approved"
					? `${import.meta.env.REACT_APP_HOST_ORIGIN}/admin/submission/approve/${submission._id}`
					: `${import.meta.env.REACT_APP_HOST_ORIGIN}/admin/submission/reject/${submission._id}`;

			const response = await axios.post(
				endpoint,
				{ adminComment: comment },
				{ withCredentials: true },
			);
			setMessageType("Success");
			addMessage(response.data?.msg);
			onProcess(submission._id); // Tell parent to remove this card from list
		} catch (err) {
			addMessage(`Erro ao processar: ${err?.response?.data?.msg}`);
		}
	};

	return (
		<div className="submission-card">
			<h3>
				{submission.targetModel === "Volume"
					? `Mudança no volume ${originalData.number} de ${originalData?.serie?.title}`
					: `Mudança na Obra de ${originalData?.title}`}
			</h3>
			<span>
				<strong>Usuário:</strong> {submission.user?.username || submission.user}
			</span>

			<div>
				<strong>Fonte/Notas:</strong>
				<p>{submission.notes}</p>
			</div>

			{submission.evidenceImage && (
				<div>
					<strong>Comprovante / Anexo:</strong>
					<div>
						<a
							href={`${import.meta.env.REACT_APP_HOST_ORIGIN}${submission.evidenceImage}`}
							target="_blank"
							rel="noreferrer"
						>
							<img
								src={`${import.meta.env.REACT_APP_HOST_ORIGIN}${submission.evidenceImage}`}
								alt="Comprovante da submissão"
								className="submission-image"
							/>
						</a>
					</div>
				</div>
			)}

			<div className="table">
				<h4>Alterações Propostas:</h4>
				<table>
					<thead>
						<tr>
							<th>Campo</th>
							<th>Novo Valor</th>
							<th>Valor Antigo</th>
						</tr>
					</thead>
					<tbody>
						{Object.entries(changes).map(([path, newValue]) => {
							const oldValue = getValueByPath(originalData, path);

							return (
								<tr key={path}>
									<td className="field-name">{path}</td>
									<td className="field-new-value">{formatValue(newValue)}</td>
									<td className="field-old-value">{formatValue(oldValue)}</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			<label className="input_label">
				Comentário sobre a supmissão
				<input
					type="text"
					name="comment"
					id="comment"
					placeholder="Comentário (Opcional)"
					value={comment}
					onChange={(e) => setComment(e.target.value)}
					className="input"
				/>
			</label>
			<div className="buttons-container">
				<button
					className="button button--red button--grow"
					onClick={() => handleAction("Rejected")}
				>
					Rejeitar
				</button>
				<button
					className="button button--green button--grow"
					onClick={() => handleAction("Approved")}
				>
					Aprovar
				</button>
			</div>
		</div>
	);
}
