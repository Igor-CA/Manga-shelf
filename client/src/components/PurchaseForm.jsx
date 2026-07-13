import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { UserContext } from "../contexts/userProvider";
import "./PurchaseForm.css";

export default function PurchaseForm({ seriesId, volumes, ownedVolumes, onPurchaseRegistered }) {
	const { user } = useContext(UserContext);
	const [amount, setAmount] = useState("");
	const [selectedVolumes, setSelectedVolumes] = useState([]);
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [success, setSuccess] = useState("");

	const userOwnedVolumeIds = ownedVolumes
		? ownedVolumes.map((ov) => ov.volume?.toString?.() || ov.volume)
		: [];

	const availableVolumes = volumes?.filter((v) =>
		userOwnedVolumeIds.includes(v.volumeId?.toString?.() || v.volumeId),
	) || [];

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
			setSelectedVolumes(availableVolumes.map((v) => v.volumeId));
		}
	};

	const pricePerVolume =
		selectedVolumes.length > 0 && parseFloat(amount) > 0
			? (parseFloat(amount) / selectedVolumes.length).toFixed(2)
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
		setSuccess("");

		try {
			const res = await axios({
				method: "POST",
				withCredentials: true,
				headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
				data: { amount: parseFloat(amount), volumeIds: selectedVolumes },
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/register-purchase`,
			});
			setSuccess(res.data.msg);
			setSelectedVolumes([]);
			setAmount("");
			if (onPurchaseRegistered) onPurchaseRegistered();
		} catch (err) {
			setError(err.response?.data?.msg || "Erro ao registrar compra");
		} finally {
			setSubmitting(false);
		}
	};

	if (!user || availableVolumes.length === 0) return null;

	return (
		<form className="purchase-form" onSubmit={handleSubmit}>
			<h3 className="purchase-form__title">Registrar compra</h3>

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
					{availableVolumes.map((vol) => (
						<label
							key={vol.volumeId}
							className={`purchase-form__volume-chip ${
								selectedVolumes.includes(vol.volumeId)
									? "purchase-form__volume-chip--selected"
									: ""
							}`}
						>
							<input
								type="checkbox"
								checked={selectedVolumes.includes(vol.volumeId)}
								onChange={() => toggleVolume(vol.volumeId)}
								style={{ display: "none" }}
							/>
							Vol. {vol.volumeNumber}
						</label>
					))}
				</div>
			</div>

			{pricePerVolume && (
				<div className="purchase-form__preview">
					R$ {pricePerVolume} por volume ({selectedVolumes.length} volume(s))
				</div>
			)}

			{error && <div className="purchase-form__error">{error}</div>}
			{success && <div className="purchase-form__success">{success}</div>}

			<button
				type="submit"
				disabled={submitting}
				className="button"
			>
				{submitting ? "Registrando..." : "Registrar compra"}
			</button>
		</form>
	);
}
