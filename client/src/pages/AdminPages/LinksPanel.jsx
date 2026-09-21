import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { messageContext } from "../../contexts/messageStateProvider";
import "./LinksPanel.css";

const API = import.meta.env.REACT_APP_HOST_ORIGIN;
const authHeaders = {
	withCredentials: true,
	headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
};

const EMPTY_PROVIDER = {
	key: "",
	name: "",
	category: "store",
	icon: "",
	brandColor: "#3db4f2",
	urlTemplate: "",
	affiliateTemplate: "",
	domains: "",
	idPattern: "",
	sampleUrl: "",
	active: true,
};

const toFormState = (provider) => ({
	...EMPTY_PROVIDER,
	...provider,
	domains: (provider.domains || []).join(", "),
	affiliateTemplate: provider.affiliateTemplate || "",
	idPattern: provider.idPattern || "",
	sampleUrl: provider.sampleUrl || "",
});

function Field({ label, hint, children }) {
	return (
		<label className="provider-form__field">
			<span className="provider-form__label">{label}</span>
			{children}
			{hint && <span className="provider-form__hint">{hint}</span>}
		</label>
	);
}

function ProviderForm({ provider, onSaved, onCancel }) {
	const [form, setForm] = useState(
		provider ? toFormState(provider) : EMPTY_PROVIDER,
	);
	const [saving, setSaving] = useState(false);
	const { addMessage } = useContext(messageContext);
	const isEdit = !!provider;

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setForm((current) => ({
			...current,
			[name]: type === "checkbox" ? checked : value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSaving(true);
		const payload = {
			...form,
			domains: form.domains
				.split(",")
				.map((domain) => domain.trim())
				.filter(Boolean),
			affiliateTemplate: form.affiliateTemplate || null,
		};

		try {
			const response = isEdit
				? await axios.put(
						`${API}/admin/link-providers/${provider._id}`,
						payload,
						authHeaders,
					)
				: await axios.post(`${API}/admin/link-providers`, payload, authHeaders);
			addMessage(
				isEdit ? "Provedor atualizado." : "Provedor criado.",
				"Success",
			);
			onSaved(response.data);
			if (!isEdit) setForm(EMPTY_PROVIDER);
		} catch (error) {
			addMessage(error?.response?.data?.msg || "Erro ao salvar provedor.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<form className="provider-form" onSubmit={handleSubmit}>
			<fieldset className="provider-form__set">
				<legend className="provider-form__legend">Identificação</legend>
				<div className="provider-form__grid">
					<Field label="Chave" hint={isEdit ? "Não pode ser alterada" : "Ex: panini"}>
						<input
							className="input"
							name="key"
							value={form.key}
							onChange={handleChange}
							required
							disabled={isEdit}
						/>
					</Field>
					<Field label="Nome">
						<input
							className="input"
							name="name"
							value={form.name}
							onChange={handleChange}
							required
						/>
					</Field>
					<Field label="Categoria" hint="Loja aparece em Onde comprar">
						<select
							className="input"
							name="category"
							value={form.category}
							onChange={handleChange}
						>
							<option value="store">Loja</option>
							<option value="info">Fonte de informação</option>
						</select>
					</Field>
					<Field label="Ícone" hint="Chave do ícone em ProviderChip">
						<input
							className="input"
							name="icon"
							value={form.icon}
							onChange={handleChange}
							required
						/>
					</Field>
					<Field label="Cor da marca">
						<div className="provider-form__color">
							<input
								type="color"
								name="brandColor"
								value={form.brandColor}
								onChange={handleChange}
							/>
							<input
								className="input"
								name="brandColor"
								value={form.brandColor}
								onChange={handleChange}
							/>
						</div>
					</Field>
					<Field label="Ativo" hint="Inativo esconde os links sem apagá-los">
						<label className="provider-form__switch">
							<input
								type="checkbox"
								name="active"
								checked={form.active}
								onChange={handleChange}
							/>
							<span>{form.active ? "Aparece no site" : "Escondido"}</span>
						</label>
					</Field>
				</div>
			</fieldset>

			<fieldset className="provider-form__set">
				<legend className="provider-form__legend">Endereço</legend>
				<div className="provider-form__grid provider-form__grid--wide">
					<Field label="Modelo de URL" hint="Use {id} no lugar do identificador">
						<input
							className="input"
							name="urlTemplate"
							value={form.urlTemplate}
							onChange={handleChange}
							placeholder="https://panini.com.br/{id}"
							required
						/>
					</Field>
					<Field
						label="Modelo de afiliado"
						hint="Opcional. Use {url} no lugar do endereço final"
					>
						<input
							className="input"
							name="affiliateTemplate"
							value={form.affiliateTemplate}
							onChange={handleChange}
							placeholder="{url}?tag=mangashelf-20"
						/>
					</Field>
				</div>
			</fieldset>

			<fieldset className="provider-form__set">
				<legend className="provider-form__legend">Leitura de links colados</legend>
				<p className="provider-form__note">
					Preencha os três campos para permitir que alguém cole uma URL desse
					site. A regra é testada contra a URL de exemplo antes de salvar.
				</p>
				<div className="provider-form__grid provider-form__grid--wide">
					<Field label="Domínios" hint="Separados por vírgula, sem www">
						<input
							className="input"
							name="domains"
							value={form.domains}
							onChange={handleChange}
							placeholder="panini.com.br"
						/>
					</Field>
					<Field label="Padrão de extração" hint="Regex, grupo 1 é o identificador">
						<input
							className="input"
							name="idPattern"
							value={form.idPattern}
							onChange={handleChange}
							placeholder="panini\.com\.br/([a-z0-9-]+)"
						/>
					</Field>
					<Field label="URL de exemplo" hint="Um link real desse site">
						<input
							className="input"
							name="sampleUrl"
							value={form.sampleUrl}
							onChange={handleChange}
							placeholder="https://panini.com.br/ao-no-flag-vol-4"
						/>
					</Field>
				</div>
			</fieldset>

			<div className="provider-form__actions">
				<button className="button" type="submit" disabled={saving}>
					{isEdit ? "Salvar alterações" : "Criar provedor"}
				</button>
				{onCancel && (
					<button type="button" className="button button--ghost" onClick={onCancel}>
						Cancelar
					</button>
				)}
			</div>
		</form>
	);
}

function ProviderRow({ provider, onEdit }) {
	return (
		<li className="provider-card">
			<span
				className="provider-card__swatch"
				style={{ backgroundColor: provider.brandColor }}
				aria-hidden="true"
			/>
			<div className="provider-card__info">
				<div className="provider-card__heading">
					<strong>{provider.name}</strong>
					<span className="provider-card__tag">
						{provider.category === "store" ? "Loja" : "Informação"}
					</span>
					{provider.active === false && (
						<span className="provider-card__tag provider-card__tag--off">
							Inativo
						</span>
					)}
					{!provider.idPattern && (
						<span className="provider-card__tag provider-card__tag--muted">
							Sem colagem de URL
						</span>
					)}
				</div>
				<code className="provider-card__template">{provider.urlTemplate}</code>
			</div>
			<button type="button" className="button button--ghost" onClick={onEdit}>
				Editar
			</button>
		</li>
	);
}

export default function LinksPanel() {
	const [providers, setProviders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [editingId, setEditingId] = useState(null);
	const [creating, setCreating] = useState(false);

	useEffect(() => {
		const fetchProviders = async () => {
			try {
				const response = await axios.get(
					`${API}/admin/link-providers`,
					authHeaders,
				);
				setProviders(response.data);
			} catch (error) {
				console.error("Erro ao buscar provedores", error);
			} finally {
				setLoading(false);
			}
		};
		fetchProviders();
	}, []);

	const handleSaved = (saved) => {
		setProviders((current) =>
			current.some((provider) => provider._id === saved._id)
				? current.map((provider) =>
						provider._id === saved._id ? saved : provider,
					)
				: [...current, saved].sort((a, b) => a.name.localeCompare(b.name)),
		);
		setEditingId(null);
		setCreating(false);
	};

	return (
		<div className="settings-group links-panel">
			<h2 className="settings-group__title" id="link-providers">
				Provedores de link
			</h2>
			<p className="links-panel__intro">
				Cada provedor vira um chip no site. O endereço nunca é guardado: ele é
				montado a partir do modelo de URL e do identificador de cada volume.
			</p>

			{loading ? (
				<div className="loading">Carregando provedores...</div>
			) : (
				<ul className="links-panel__list">
					{providers.map((provider) =>
						editingId === provider._id ? (
							<li key={provider._id} className="links-panel__editing">
								<ProviderForm
									provider={provider}
									onSaved={handleSaved}
									onCancel={() => setEditingId(null)}
								/>
							</li>
						) : (
							<ProviderRow
								key={provider._id}
								provider={provider}
								onEdit={() => setEditingId(provider._id)}
							/>
						),
					)}
				</ul>
			)}

			{creating ? (
				<div className="links-panel__editing">
					<ProviderForm
						onSaved={handleSaved}
						onCancel={() => setCreating(false)}
					/>
				</div>
			) : (
				<button
					type="button"
					className="button"
					onClick={() => setCreating(true)}
				>
					Novo provedor
				</button>
			)}
		</div>
	);
}
