import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { FaTrash } from "react-icons/fa";
import { messageContext } from "../../contexts/messageStateProvider";
import "./LinksSubmissionForm.css";

const API = import.meta.env.REACT_APP_HOST_ORIGIN;
const authHeaders = {
	withCredentials: true,
	headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
};

const toRows = (links) =>
	(links || []).map((link, index) => ({
		id: `existing-${link.provider}-${index}`,
		provider: link.provider,
		name: link.name,
		url: link.url,
		derived: !!link.derived,
		originalProvider: link.provider,
		originalUrl: link.url,
	}));

const buildChangeSet = (rows, originalRows) => {
	const add = [];
	const remove = [];

	for (const row of rows) {
		if (row.derived || !row.provider || !row.url.trim()) continue;

		const isNew = !row.originalProvider;
		const changedSite = !isNew && row.originalProvider !== row.provider;
		const changedUrl = !isNew && row.originalUrl !== row.url.trim();

		if (isNew || changedSite || changedUrl) {
			add.push({ provider: row.provider, url: row.url.trim() });
		}
		if (changedSite) remove.push({ provider: row.originalProvider });
	}

	const keptIds = new Set(rows.map((row) => row.id));
	for (const row of originalRows) {
		if (row.derived) continue;
		if (!keptIds.has(row.id)) remove.push({ provider: row.originalProvider });
	}

	return { add, remove };
};

export default function LinksSubmissionForm({
	targetModel,
	targetId,
	currentLinks,
}) {
	const { addMessage } = useContext(messageContext);
	const [providers, setProviders] = useState([]);
	const [originalRows, setOriginalRows] = useState([]);
	const [rows, setRows] = useState([]);
	const [notes, setNotes] = useState("");
	const [sending, setSending] = useState(false);

	useEffect(() => {
		const initial = toRows(currentLinks);
		setOriginalRows(initial);
		setRows(initial);
	}, [currentLinks]);

	useEffect(() => {
		const fetchProviders = async () => {
			try {
				const response = await axios.get(
					`${API}/api/data/link-providers`,
					authHeaders,
				);
				setProviders(response.data);
			} catch (error) {
				addMessage("Erro ao carregar a lista de sites.");
			}
		};
		fetchProviders();
	}, []);

	const changeSet = buildChangeSet(rows, originalRows);
	const hasChanges = changeSet.add.length > 0 || changeSet.remove.length > 0;

	const updateRow = (id, field, value) => {
		setRows((current) =>
			current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
		);
	};

	const addRow = () => {
		setRows((current) => [
			...current,
			{
				id: `new-${Date.now()}`,
				provider: "",
				name: "",
				url: "",
				derived: false,
				originalProvider: null,
				originalUrl: null,
			},
		]);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		const chosen = rows
			.filter((row) => !row.derived && row.provider)
			.map((row) => row.provider);
		if (new Set(chosen).size !== chosen.length) {
			addMessage("Cada site pode ter apenas um link.");
			return;
		}
		if (!hasChanges) {
			addMessage("Nenhuma alteração nos links.");
			return;
		}

		setSending(true);
		try {
			await axios.post(
				`${API}/api/user/link-submission`,
				{ targetModel, targetId, notes, links: changeSet },
				authHeaders,
			);
			addMessage("Sugestão de links enviada para aprovação!", "Success");
			setOriginalRows(
				rows.map((row) => ({
					...row,
					originalProvider: row.provider,
					originalUrl: row.url,
				})),
			);
			setNotes("");
		} catch (error) {
			addMessage(
				error?.response?.data?.msg || "Erro ao enviar sugestão de links.",
			);
		} finally {
			setSending(false);
		}
	};

	return (
		<form className="settings-group links-form" onSubmit={handleSubmit}>
			<h2 className="settings-group__title" id="links">
				Links
			</h2>
			<p className="input_obs links-form__intro">
				Sugira links que faltam ou corrija os que estão errados. Um
				administrador revisa antes de valer.
			</p>

			<button type="button" className="button links-form__add" onClick={addRow}>
				Adicionar link
			</button>

			<div className="links-list">
				<div className="links-head">
					<span>Site</span>
					<span>URL</span>
					<span />
				</div>

				{rows.map((row) => (
					<div className="links-row" key={row.id}>
						{row.derived ? (
							<input className="input" value={row.name} disabled />
						) : (
							<select
								className="input"
								value={row.provider}
								onChange={(e) => updateRow(row.id, "provider", e.target.value)}
								required
							>
								<option value="" disabled>
									Escolha o site
								</option>
								{providers.map((provider) => (
									<option key={provider.key} value={provider.key}>
										{provider.name}
									</option>
								))}
							</select>
						)}

						<input
							className="input"
							value={row.url}
							placeholder="Cole o endereço da página nesse site"
							onChange={(e) => updateRow(row.id, "url", e.target.value)}
							disabled={row.derived}
							required
						/>

						{row.derived ? (
							<span className="links-row__auto">automático</span>
						) : (
							<button
								type="button"
								className="button button--red links-row__remove"
								title="Remover"
								onClick={() =>
									setRows((current) =>
										current.filter((item) => item.id !== row.id),
									)
								}
							>
								<FaTrash />
							</button>
						)}
					</div>
				))}
			</div>

			<label className="input_label links-form__notes">
				Observação (opcional)
				<input
					className="input"
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					placeholder="De onde veio o link, por que o antigo está errado..."
				/>
			</label>
			<button className="button" type="submit" disabled={sending || !hasChanges}>
				Enviar sugestão de links
			</button>
		</form>
	);
}
