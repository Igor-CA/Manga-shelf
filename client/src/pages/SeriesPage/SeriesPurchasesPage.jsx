import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { UserContext } from "../../contexts/userProvider";
import { usePrompt } from "../../contexts/PromptContext";
import { FaTrash, FaPencilAlt } from "react-icons/fa";
import { formatCurrency, formatDate } from "../../utils/formatters";
import {
	VOLUME_CONDITIONS,
	CONDITION_LABELS,
} from "../../utils/volumeConditions";
import BarChartComponent from "../../components/graphs/BarChart";

const API = import.meta.env.REACT_APP_HOST_ORIGIN;
const AUTH = import.meta.env.REACT_APP_API_KEY;

const idOf = (value) => value?.toString?.() || value;


const formatMonth = (month) => {
	const [year, monthNumber] = month.split("-").map(Number);
	return new Date(Date.UTC(year, monthNumber - 1)).toLocaleDateString("pt-BR", {
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	});
};

const volumeLabel = (vol) =>
	vol.isVariant
		? `Vol. ${vol.volumeNumber} · variante ${vol.variantNumber || 1}`
		: `Vol. ${vol.volumeNumber}`;

export default function SeriesPurchasesPage({ series }) {
	const { user } = useContext(UserContext);
	const { confirm } = usePrompt();
	const [priceStats, setPriceStats] = useState(null);
	const [communityPurchases, setCommunityPurchases] = useState([]);
	const [myPurchases, setMyPurchases] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editingPurchase, setEditingPurchase] = useState(null);

	const userOwnedVolumeIds =
		user?.ownedVolumes
			?.filter((ov) =>
				series.volumes?.some((v) => idOf(v.volumeId) === idOf(ov.volume)),
			)
			.map((ov) => idOf(ov.volume)) || [];

	const availableVolumes =
		series.volumes?.filter((v) =>
			userOwnedVolumeIds.includes(idOf(v.volumeId)),
		) || [];

	const myPriceByVolumeId = new Map(
		(user?.ownedVolumes || [])
			.filter((ov) => ov.purchasePrice != null)
			.map((ov) => [idOf(ov.volume), ov.purchasePrice]),
	);

	const fetchPriceStats = async () => {
		try {
			const res = await axios({
				method: "GET",
				headers: { Authorization: AUTH },
				url: `${API}/api/data/series/${series.id}/price-stats`,
			});
			setPriceStats(res.data);
		} catch {
			setPriceStats(null);
		}
	};

	const fetchCommunityPurchases = async () => {
		try {
			const res = await axios({
				method: "GET",
				headers: { Authorization: AUTH },
				url: `${API}/api/data/series/${series.id}/purchases`,
			});
			setCommunityPurchases(res.data);
		} catch {
			setCommunityPurchases([]);
		}
	};

	const fetchMyPurchases = async () => {
		if (!user) return;
		try {
			const res = await axios({
				method: "GET",
				withCredentials: true,
				headers: { Authorization: AUTH },
				url: `${API}/api/user/purchases/${series.id}`,
			});
			setMyPurchases(res.data);
		} catch {
			setMyPurchases([]);
		}
	};

	const fetchAll = async () => {
		setLoading(true);
		await Promise.all([
			fetchPriceStats(),
			fetchCommunityPurchases(),
			fetchMyPurchases(),
		]);
		setLoading(false);
	};

	useEffect(() => {
		fetchAll();
	}, [user, series.id]);

	const handleDelete = async (purchaseId) => {
		confirm(
			"Remover esta compra? Os preços já registrados nos volumes são mantidos, porque eles são o registro do que você pagou.",
			async () => {
				try {
					await axios({
						method: "DELETE",
						withCredentials: true,
						headers: { Authorization: AUTH },
						url: `${API}/api/user/purchases/${purchaseId}`,
					});
					fetchAll();
				} catch (err) {
					console.error(err);
				}
			},
		);
	};

	const handleEdit = (purchase) => {
		setEditingPurchase(purchase);
		setShowForm(true);
	};

	const handleFormDone = () => {
		setShowForm(false);
		setEditingPurchase(null);
		fetchAll();
	};

	const summary = priceStats?.summary;
	const hasCommunityData =
		summary &&
		Object.values(summary).some((segment) => segment.median != null);

	const pageWrapper = (children) => (
		<div className="container">
			<div className="content-overall__container">
				<div className="overall-content__container">
					<hr style={{ margin: "0px 10px" }} />
					<h2 className="collection-lable">Compras</h2>
					{children}
				</div>
			</div>
		</div>
	);

	return pageWrapper(
		<div className="purchases-page">
			<div className="purchases-community">
				<h3 className="purchases-section-title">Preços pagos pela comunidade</h3>
				{loading ? (
					<p className="purchases-page__empty">Carregando...</p>
				) : hasCommunityData ? (
					<>
						<div className="purchases-stats">
							<CommunityStat
								label="Mediana por volume (usado)"
								segment={summary.usado}
							/>
							<CommunityStat
								label="Mediana por volume (novo)"
								segment={summary.novo}
							/>
							<CommunityStat
								label="Mediana por volume (geral)"
								segment={summary.geral}
							/>
						</div>
						<p className="purchases-community__note">
							Medianas dos preços que outros leitores registraram. Só aparecem
							em volumes com registros suficientes para não identificar
							ninguém.
						</p>
					</>
				) : (
					<p className="purchases-page__empty">
						Ainda não há registros suficientes desta obra para mostrar preços da
						comunidade.
					</p>
				)}
			</div>

			{user && (
				<VolumePriceChart
					volumes={availableVolumes}
					priceByVolumeId={myPriceByVolumeId}
				/>
			)}

			{user && availableVolumes.length > 0 && (
				<div className="purchases-list-section">
					<div className="purchases-list-header">
						{(myPurchases.length > 0 || showForm) && (
							<h3 className="purchases-section-title">Suas compras</h3>
						)}
						{!showForm && (
							<button
								className="button"
								onClick={() => {
									setEditingPurchase(null);
									setShowForm(true);
								}}
							>
								Registrar compra
							</button>
						)}
					</div>

					{showForm && (
						<PurchaseFormInline
							key={editingPurchase?._id || "new"}
							seriesId={series.id}
							availableVolumes={availableVolumes}
							editingPurchase={editingPurchase}
							myPurchases={myPurchases}
							confirm={confirm}
							onDone={handleFormDone}
							onCancel={() => {
								setShowForm(false);
								setEditingPurchase(null);
							}}
						/>
					)}

					{myPurchases.length > 0 && (
						<div className="purchases-list">
							{myPurchases.map((purchase) => (
								<PurchaseCard
									key={purchase._id}
									purchase={purchase}
									volumes={series.volumes}
									myPriceByVolumeId={myPriceByVolumeId}
									onEdit={() => handleEdit(purchase)}
									onDelete={() => handleDelete(purchase._id)}
								/>
							))}
						</div>
					)}
				</div>
			)}

			<div className="purchases-list-section">
				<h3 className="purchases-section-title">Compras da comunidade</h3>
				{loading ? (
					<p className="purchases-page__empty">Carregando...</p>
				) : communityPurchases.length === 0 ? (
					<p className="purchases-page__empty">
						Nenhuma compra registrada para esta obra.
					</p>
				) : (
					<div className="purchases-list">
						{communityPurchases.map((purchase, index) => (
							<PurchaseCard
								key={index}
								purchase={purchase}
								volumes={series.volumes}
								readOnly
							/>
						))}
					</div>
				)}
			</div>
		</div>,
	);
}

function VolumePriceChart({ volumes, priceByVolumeId }) {
	const data = volumes.map((vol) => ({
		name: vol.isVariant
			? `${vol.volumeNumber}v${vol.variantNumber || 1}`
			: String(vol.volumeNumber),
		label: volumeLabel(vol),
		count: priceByVolumeId.get(idOf(vol.volumeId)) ?? null,
	}));
	const priced = data.filter((row) => row.count != null);
	if (priced.length === 0) return null;

	const average =
		priced.reduce((sum, row) => sum + row.count, 0) / priced.length;

	return (
		<div className="purchases-volume-prices">
			<h3 className="purchases-section-title">Seus preços por volume</h3>
			<BarChartComponent
				chartTitle={`${priced.length} de ${data.length} volumes com preço · média ${formatCurrency(average)}`}
				data={data}
				categoryLabel="Volume"
				valueLabel="Preço"
				formatValue={formatCurrency}
				minSlotWidth={32}
			/>
			<details className="purchases-volume-prices__details">
				<summary>Ver valores</summary>
				<ul className="purchases-volume-prices__values">
					{priced.map((row) => (
						<li key={row.label} className="purchases-volume-prices__value">
							<span>{row.label}</span>
							<span>{formatCurrency(row.count)}</span>
						</li>
					))}
				</ul>
			</details>
		</div>
	);
}

function CommunityStat({ label, segment }) {
	return (
		<div className="purchases-stats__item">
			<span className="purchases-stats__value">
				{segment.median != null ? formatCurrency(segment.median) : "Sem dados"}
			</span>
			<span className="purchases-stats__label">{label}</span>
			{segment.median != null && (
				<span className="purchases-stats__note">
					{segment.count} volume(s) com dados
				</span>
			)}
		</div>
	);
}

function PurchaseCard({
	purchase,
	volumes,
	myPriceByVolumeId = new Map(),
	onEdit,
	onDelete,
	readOnly,
}) {
	const coveredVolumes = purchase.volumes.map((vid) => {
		const id = idOf(vid);
		const vol = volumes?.find((v) => idOf(v.volumeId) === id);
		return { id, label: vol ? volumeLabel(vol) : id };
	});

	const pricePerVol =
		purchase.volumes.length > 0
			? purchase.amount / purchase.volumes.length
			: 0;

	const currentSum = coveredVolumes.reduce(
		(sum, v) => sum + (myPriceByVolumeId.get(v.id) || 0),
		0,
	);
	const divergence = Math.round((currentSum - purchase.amount) * 100) / 100;

	const displayDate = purchase.month
		? formatMonth(purchase.month)
		: formatDate(purchase.purchaseDate || purchase.createdAt);

	const conditionAndStore = [CONDITION_LABELS[purchase.condition], purchase.store]
		.filter(Boolean)
		.join(" · ");

	return (
		<div className="purchase-card">
			<div className="purchase-card__info">
				<div className="purchase-card__amount">
					{formatCurrency(purchase.amount)}
				</div>
				<div className="purchase-card__details">
					{purchase.volumes.length} volume(s) &middot;{" "}
					{formatCurrency(pricePerVol)}/vol
				</div>
				<div className="purchase-card__volumes">
					{coveredVolumes.map((v) => v.label).join(", ")}
				</div>
				{conditionAndStore && (
					<div className="purchase-card__volumes">{conditionAndStore}</div>
				)}
				{!readOnly && divergence !== 0 && (
					<div className="purchase-card__divergence">
						Seus volumes somam {formatCurrency(currentSum)} hoje,{" "}
						{divergence > 0 ? "acima" : "abaixo"} do valor desta compra em{" "}
						{formatCurrency(Math.abs(divergence))}.
					</div>
				)}
				{displayDate && (
					<div className="purchase-card__date">{displayDate}</div>
				)}
			</div>
			{!readOnly && (
				<div className="purchase-card__actions">
					<button
						className="button button--secondary purchase-card__btn"
						onClick={onEdit}
						title="Editar"
					>
						<FaPencilAlt />
					</button>
					<button
						className="button button--red purchase-card__btn"
						onClick={onDelete}
						title="Remover"
					>
						<FaTrash />
					</button>
				</div>
			)}
		</div>
	);
}

function PurchaseFormInline({
	seriesId,
	availableVolumes,
	editingPurchase,
	myPurchases,
	confirm,
	onDone,
	onCancel,
}) {
	const [amount, setAmount] = useState(
		editingPurchase ? String(editingPurchase.amount) : "",
	);
	const [selectedVolumes, setSelectedVolumes] = useState(
		editingPurchase ? editingPurchase.volumes.map(idOf) : [],
	);
	const [purchaseDate, setPurchaseDate] = useState(
		editingPurchase?.purchaseDate
			? new Date(editingPurchase.purchaseDate).toISOString().split("T")[0]
			: "",
	);
	const [condition, setCondition] = useState(
		editingPurchase?.condition || "usado",
	);
	const [store, setStore] = useState(editingPurchase?.store || "");
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const toggleVolume = (volumeId) => {
		setSelectedVolumes((prev) =>
			prev.includes(volumeId)
				? prev.filter((id) => id !== volumeId)
				: [...prev, volumeId],
		);
	};

	const selectAll = () => {
		if (selectedVolumes.length === availableVolumes.length) {
			setSelectedVolumes([]);
		} else {
			setSelectedVolumes(availableVolumes.map((v) => idOf(v.volumeId)));
		}
	};

	const pricePerVolume =
		selectedVolumes.length > 0 && parseFloat(amount) > 0
			? parseFloat(amount) / selectedVolumes.length
			: null;

	const submit = async () => {
		setSubmitting(true);
		setError("");

		try {
			const data = {
				seriesId,
				amount: parseFloat(amount),
				volumeIds: selectedVolumes,
				condition,
				store: store.trim(),
			};
			if (purchaseDate) data.purchaseDate = purchaseDate;

			await axios({
				method: editingPurchase ? "PUT" : "POST",
				withCredentials: true,
				headers: { Authorization: AUTH },
				data,
				url: editingPurchase
					? `${API}/api/user/purchases/${editingPurchase._id}`
					: `${API}/api/user/purchases`,
			});
			onDone();
		} catch (err) {
			const msg = err.response?.data?.msg;
			setError(
				Array.isArray(msg) ? msg.join(" ") : msg || "Erro ao salvar compra",
			);
		} finally {
			setSubmitting(false);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (selectedVolumes.length === 0) {
			setError("Selecione ao menos um volume");
			return;
		}
		if (!amount || parseFloat(amount) <= 0) {
			setError("Informe um valor válido");
			return;
		}

		const overlapping = availableVolumes.filter((vol) => {
			const vid = idOf(vol.volumeId);
			if (!selectedVolumes.includes(vid)) return false;
			return myPurchases.some(
				(p) =>
					p._id !== editingPurchase?._id &&
					p.volumes.map(idOf).includes(vid),
			);
		});

		if (overlapping.length > 0) {
			const names = overlapping.map(volumeLabel).join(", ");
			confirm(
				`${names} já faz parte de outra compra sua. Registrar esta compra vai sobrescrever o preço desse volume, e o valor por cópia da compra anterior será perdido. Continuar?`,
				submit,
			);
			return;
		}

		submit();
	};

	return (
		<form className="purchase-form" onSubmit={handleSubmit}>
			<div className="purchase-form__row">
				<label className="purchase-form__field">
					<span className="purchase-form__label">Valor total pago (R$)</span>
					<input
						type="number"
						step="0.01"
						min="0"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						placeholder="0,00"
						className="purchase-form__input"
					/>
				</label>
				<label className="purchase-form__field">
					<span className="purchase-form__label">Data da compra (opcional)</span>
					<input
						type="date"
						value={purchaseDate}
						onChange={(e) => setPurchaseDate(e.target.value)}
						className="purchase-form__input"
					/>
				</label>
			</div>

			<div className="purchase-form__row">
				<label className="purchase-form__field">
					<span className="purchase-form__label">Condição</span>
					<select
						value={condition}
						onChange={(e) => setCondition(e.target.value)}
						className="purchase-form__input"
					>
						{VOLUME_CONDITIONS.map(({ value, label }) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</label>
				<label className="purchase-form__field">
					<span className="purchase-form__label">Onde comprou (opcional)</span>
					<input
						type="text"
						maxLength={100}
						value={store}
						onChange={(e) => setStore(e.target.value)}
						placeholder="Shopee, sebo, outro colecionador..."
						className="purchase-form__input"
					/>
				</label>
			</div>

			<div className="purchase-form__field">
				<div className="purchase-form__volumes-header">
					<span className="purchase-form__label">Volumes comprados</span>
					<button
						type="button"
						className="purchase-form__select-all"
						onClick={selectAll}
					>
						{selectedVolumes.length === availableVolumes.length
							? "Desmarcar todos"
							: "Selecionar todos"}
					</button>
				</div>
				<div className="purchase-form__volumes-grid">
					{availableVolumes.map((vol) => {
						const vid = idOf(vol.volumeId);
						return (
							<label
								key={vid}
								className={`purchase-form__volume-chip ${
									selectedVolumes.includes(vid)
										? "purchase-form__volume-chip--selected"
										: ""
								} ${
									vol.isVariant ? "purchase-form__volume-chip--variant" : ""
								}`}
							>
								<input
									type="checkbox"
									checked={selectedVolumes.includes(vid)}
									onChange={() => toggleVolume(vid)}
									style={{ display: "none" }}
								/>
								{volumeLabel(vol)}
							</label>
						);
					})}
				</div>
			</div>

			{pricePerVolume && (
				<p className="purchase-form__preview">
					{formatCurrency(pricePerVolume)} por volume ({selectedVolumes.length}{" "}
					volume(s))
				</p>
			)}

			{error && <div className="purchase-form__error">{error}</div>}

			<div className="purchase-form__actions">
				<button type="button" className="button button--red" onClick={onCancel}>
					Cancelar
				</button>
				<button type="submit" disabled={submitting} className="button">
					{submitting
						? "Salvando..."
						: editingPurchase
							? "Salvar alterações"
							: "Registrar compra"}
				</button>
			</div>
		</form>
	);
}
