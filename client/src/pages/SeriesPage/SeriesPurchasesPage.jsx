import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { UserContext } from "../../contexts/userProvider";
import { FaTrash, FaPencilAlt } from "react-icons/fa";
import "../../components/PurchaseForm.css";

const API = import.meta.env.REACT_APP_HOST_ORIGIN;
const AUTH = import.meta.env.REACT_APP_API_KEY;

const formatCurrency = (value) =>
	value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatDate = (dateStr) => {
	if (!dateStr) return null;
	return new Date(dateStr).toLocaleDateString("pt-BR");
};

export default function SeriesPurchasesPage({ series }) {
	const { user } = useContext(UserContext);
	const [allPurchases, setAllPurchases] = useState([]);
	const [myPurchases, setMyPurchases] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editingPurchase, setEditingPurchase] = useState(null);

	const userOwnedVolumeIds =
		user?.ownedVolumes
			?.filter((ov) =>
				series.volumes?.some(
					(v) =>
						(v.volumeId?.toString?.() || v.volumeId) ===
						(ov.volume?.toString?.() || ov.volume),
				),
			)
			.map((ov) => ov.volume?.toString?.() || ov.volume) || [];

	const availableVolumes =
		series.volumes?.filter((v) =>
			userOwnedVolumeIds.includes(v.volumeId?.toString?.() || v.volumeId),
		) || [];

	const fetchAllPurchases = async () => {
		try {
			const res = await axios({
				method: "GET",
				headers: { Authorization: AUTH },
				url: `${API}/api/data/series/${series.id}/purchases`,
			});
			setAllPurchases(res.data);
		} catch {
			setAllPurchases([]);
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
		await Promise.all([fetchAllPurchases(), fetchMyPurchases()]);
		setLoading(false);
	};

	useEffect(() => {
		fetchAll();
	}, [user, series.id]);

	const handleDelete = async (purchaseId) => {
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

	// Stats from ALL purchases (community)
	const totalPurchases = allPurchases.length;
	const allVolumePrices = [];
	for (const p of allPurchases) {
		if (p.volumes.length === 0) continue;
		const ppv = p.amount / p.volumes.length;
		for (let i = 0; i < p.volumes.length; i++) {
			allVolumePrices.push(ppv);
		}
	}
	const communityAvg =
		allVolumePrices.length > 0
			? allVolumePrices.reduce((a, b) => a + b, 0) / allVolumePrices.length
			: 0;

	// Stats from MY purchases
	const myTotalSpent = myPurchases.reduce((sum, p) => sum + p.amount, 0);
	const myPurchasedVolumeIds = new Set(
		myPurchases.flatMap((p) => p.volumes.map((v) => v.toString?.() || v)),
	);
	const myAvgPerVolume =
		myPurchasedVolumeIds.size > 0
			? myTotalSpent / myPurchasedVolumeIds.size
			: 0;

	// Build per-volume price map from my purchases
	const volumePriceMap = {};
	for (const purchase of myPurchases) {
		if (purchase.volumes.length === 0) continue;
		const ppv = purchase.amount / purchase.volumes.length;
		for (const vid of purchase.volumes) {
			const key = vid.toString?.() || vid;
			volumePriceMap[key] = ppv;
		}
	}

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
			{/* Community stats */}
			{totalPurchases > 0 && (
				<div className="purchases-stats">
					<div className="purchases-stats__item">
						<span className="purchases-stats__value">
							{formatCurrency(communityAvg)}
						</span>
						<span className="purchases-stats__label">
							Preço médio por volume (comunidade)
						</span>
					</div>
					<div className="purchases-stats__item">
						<span className="purchases-stats__value">
							{totalPurchases}
						</span>
						<span className="purchases-stats__label">
							Compras registradas
						</span>
					</div>
					{user && myPurchases.length > 0 && (
						<>
							<div className="purchases-stats__item">
								<span className="purchases-stats__value">
									{formatCurrency(myTotalSpent)}
								</span>
								<span className="purchases-stats__label">
									Seu total gasto
								</span>
							</div>
							<div className="purchases-stats__item">
								<span className="purchases-stats__value">
									{formatCurrency(myAvgPerVolume)}
								</span>
								<span className="purchases-stats__label">
									Seu preço médio/vol
								</span>
							</div>
						</>
					)}
				</div>
			)}

			{/* My volume prices grid */}
			{user && Object.keys(volumePriceMap).length > 0 && (
				<div className="purchases-volume-prices">
					<h3 className="purchases-section-title">Seus preços por volume</h3>
					<div className="purchases-volume-prices__grid">
						{availableVolumes.map((vol) => {
							const vid = vol.volumeId?.toString?.() || vol.volumeId;
							const price = volumePriceMap[vid];
							return (
								<div
									key={vid}
									className={`purchases-volume-price-chip ${
										price !== undefined
											? "purchases-volume-price-chip--has-price"
											: ""
									}`}
								>
									<span className="purchases-volume-price-chip__number">
										Vol. {vol.volumeNumber}
									</span>
									{price !== undefined && (
										<span className="purchases-volume-price-chip__price">
											{formatCurrency(price)}
										</span>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* My purchases with CRUD */}
			{user && availableVolumes.length > 0 && (
				<div className="purchases-list-section">
					<div className="purchases-list-header">
						<h3 className="purchases-section-title">Suas compras</h3>
						<button
							className="button"
							onClick={() => {
								setEditingPurchase(null);
								setShowForm(!showForm);
							}}
						>
							{showForm ? "Cancelar" : "Nova compra"}
						</button>
					</div>

					{showForm && (
						<PurchaseFormInline
							seriesId={series.id}
							availableVolumes={availableVolumes}
							editingPurchase={editingPurchase}
							onDone={handleFormDone}
							onCancel={() => {
								setShowForm(false);
								setEditingPurchase(null);
							}}
						/>
					)}

					{myPurchases.length === 0 && !showForm ? (
						<p className="purchases-page__empty">
							Você ainda não registrou nenhuma compra para esta obra.
						</p>
					) : (
						<div className="purchases-list">
							{myPurchases.map((purchase) => (
								<PurchaseCard
									key={purchase._id}
									purchase={purchase}
									volumes={series.volumes}
									onEdit={() => handleEdit(purchase)}
									onDelete={() => handleDelete(purchase._id)}
								/>
							))}
						</div>
					)}
				</div>
			)}

			{/* All community purchases (read-only) */}
			<div className="purchases-list-section">
				<h3 className="purchases-section-title">Todas as compras da comunidade</h3>
				{loading ? (
					<p className="purchases-page__empty">Carregando...</p>
				) : allPurchases.length === 0 ? (
					<p className="purchases-page__empty">
						Nenhuma compra registrada para esta obra.
					</p>
				) : (
					<div className="purchases-list">
						{allPurchases.map((purchase) => (
							<PurchaseCard
								key={purchase._id}
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

function PurchaseCard({ purchase, volumes, onEdit, onDelete, readOnly }) {
	const volumeNames = purchase.volumes.map((vid) => {
		const id = vid.toString?.() || vid;
		const vol = volumes?.find(
			(v) => (v.volumeId?.toString?.() || v.volumeId) === id,
		);
		return vol ? `Vol. ${vol.volumeNumber}` : id;
	});

	const pricePerVol =
		purchase.volumes.length > 0
			? purchase.amount / purchase.volumes.length
			: 0;

	const displayDate = purchase.purchaseDate
		? formatDate(purchase.purchaseDate)
		: formatDate(purchase.createdAt);

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
				<div className="purchase-card__volumes">{volumeNames.join(", ")}</div>
				{displayDate && (
					<div className="purchase-card__date">{displayDate}</div>
				)}
			</div>
			{!readOnly && onEdit && onDelete && (
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
	onDone,
	onCancel,
}) {
	const [amount, setAmount] = useState(
		editingPurchase ? String(editingPurchase.amount) : "",
	);
	const [selectedVolumes, setSelectedVolumes] = useState(
		editingPurchase
			? editingPurchase.volumes.map((v) => v.toString?.() || v)
			: [],
	);
	const [purchaseDate, setPurchaseDate] = useState(
		editingPurchase?.purchaseDate
			? new Date(editingPurchase.purchaseDate).toISOString().split("T")[0]
			: "",
	);
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
			setSelectedVolumes(
				availableVolumes.map((v) => v.volumeId?.toString?.() || v.volumeId),
			);
		}
	};

	const pricePerVolume =
		selectedVolumes.length > 0 && parseFloat(amount) > 0
			? parseFloat(amount) / selectedVolumes.length
			: null;

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

		setSubmitting(true);
		setError("");

		try {
			const data = {
				amount: parseFloat(amount),
				volumeIds: selectedVolumes,
			};
			if (purchaseDate) data.purchaseDate = purchaseDate;

			if (editingPurchase) {
				await axios({
					method: "PUT",
					withCredentials: true,
					headers: { Authorization: AUTH },
					data,
					url: `${API}/api/user/purchases/${editingPurchase._id}`,
				});
			} else {
				await axios({
					method: "POST",
					withCredentials: true,
					headers: { Authorization: AUTH },
					data: { ...data, seriesId },
					url: `${API}/api/user/purchases`,
				});
			}
			onDone();
		} catch (err) {
			setError(err.response?.data?.msg || "Erro ao salvar compra");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form className="purchase-form" onSubmit={handleSubmit}>
			<div className="purchase-form__field">
				<label htmlFor="purchase-amount">Valor total pago (R$)</label>
				<input
					id="purchase-amount"
					type="number"
					step="0.01"
					min="0"
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
					placeholder="0,00"
					className="purchase-form__input"
				/>
			</div>

			<div className="purchase-form__field">
				<label htmlFor="purchase-date">Data da compra (opcional)</label>
				<input
					id="purchase-date"
					type="date"
					value={purchaseDate}
					onChange={(e) => setPurchaseDate(e.target.value)}
					className="purchase-form__input"
				/>
			</div>

			<div className="purchase-form__field">
				<div className="purchase-form__volumes-header">
					<label>Volumes comprados</label>
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
						const vid = vol.volumeId?.toString?.() || vol.volumeId;
						return (
							<label
								key={vid}
								className={`purchase-form__volume-chip ${
									selectedVolumes.includes(vid)
										? "purchase-form__volume-chip--selected"
										: ""
								}`}
							>
								<input
									type="checkbox"
									checked={selectedVolumes.includes(vid)}
									onChange={() => toggleVolume(vid)}
									style={{ display: "none" }}
								/>
								Vol. {vol.volumeNumber}
							</label>
						);
					})}
				</div>
			</div>

			{pricePerVolume && (
				<div className="purchase-form__preview">
					{formatCurrency(pricePerVolume)} por volume ({selectedVolumes.length}{" "}
					volume(s))
				</div>
			)}

			{error && <div className="purchase-form__error">{error}</div>}

			<div className="purchase-form__actions">
				<button type="submit" disabled={submitting} className="button">
					{submitting
						? "Salvando..."
						: editingPurchase
							? "Salvar alterações"
							: "Registrar compra"}
				</button>
				<button
					type="button"
					className="button button--secondary"
					onClick={onCancel}
				>
					Cancelar
				</button>
			</div>
		</form>
	);
}
