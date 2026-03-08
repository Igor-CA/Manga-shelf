import { useContext, useMemo, useRef, useState } from "react";
import { formatDate, printArray } from "../../utils/seriesDataFunctions";
import { Link } from "react-router-dom";
import { FaPencilAlt } from "react-icons/fa";
import { UserContext } from "../../contexts/userProvider";

export default function VolumesOverallPage({ volume }) {
	const { user } = useContext(UserContext);
	const {
		serie,
		pagesNumber,
		date,
		ISBN,
		defaultPrice,
		freebies,
		chapters,
		hasVariant,
		summary,
		avgPricePaid,
		avgPriceCount,
	} = volume;
	const volumeSummarry = useRef(null);
	const [showingMore, setShowingMore] = useState(false);
	const ownedVol = user?.ownedVolumes?.find(
		(ov) => (ov.volume?.toString?.() || ov.volume) === volume._id,
	);
	const purchasePrice = ownedVol?.purchasePrice;

	const formatCurrency = (value) =>
		value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

	const detailsSchema = useMemo(() => {
		if (!volume) return [];

		return [
			{ label: "Autores", value: printArray(serie.authors) },
			{ label: "Número de páginas", value: pagesNumber },
			{ label: "Data de lançamento", value: formatDate(date) },
			{ label: "Preço de capa", value: defaultPrice != null ? formatCurrency(defaultPrice) : null },
			{
				label: "Preço pago",
				value: purchasePrice != null ? formatCurrency(purchasePrice) : null,
			},
			{
				label: "Preço médio pago",
				value: avgPricePaid != null ? formatCurrency(avgPricePaid) : null,
				suffix: avgPriceCount > 0 ? ` (${avgPriceCount} compra${avgPriceCount > 1 ? "s" : ""})` : null,
			},
			{ label: "ISBN", value: ISBN },
			{ label: "Capítulos", value: chapters },
			{ label: "Possui Capas variantes", value: hasVariant },
			{
				label: "Brindes",
				value: freebies?.length > 0 ? printArray(freebies) : null,
			},
		];
	}, [volume, purchasePrice, avgPricePaid]);
	return (
		<div className="container">
			<div className="content-overall__container">
				{summary?.length > 0 && (
					<div className="content__details-summary content__details-summary--mobile">
						<strong>Sinopse:</strong>
						<div
							ref={volumeSummarry}
							className={`content__summary ${
								showingMore ? "content__summary--show-full" : ""
							}`}
						>
							{summary.map((paragraph, i) => (
								<p key={i}>{paragraph}</p>
							))}
						</div>
						{!showingMore && (
							<button
								className="show-more__button"
								aria-label="Mostrar mais"
								onClick={() => setShowingMore(true)}
							>
								Mostrar mais
							</button>
						)}
					</div>
				)}
				<ul className="all-info-container">
					{detailsSchema.map((item, index) => {
						if (
							!item.value ||
							(Array.isArray(item.value) && item.value.length === 0)
						) {
							return null;
						}

						return (
							<li key={index}>
								<strong>{item.label}: </strong>
								{item.value}
								{item.suffix && <span>{item.suffix}</span>}
							</li>
						);
					})}
					<Link className="button" to={`/submissions/volume/${volume._id}`}>
						<FaPencilAlt /> Editar informações
					</Link>
				</ul>
			</div>
		</div>
	);
}
