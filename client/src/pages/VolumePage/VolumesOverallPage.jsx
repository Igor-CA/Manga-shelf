import { useMemo } from "react";
import { formatDate, printArray } from "../SeriesPage/utils";

export default function VolumesOverallPage({ volume }) {
	const {
		serie,
		pagesNumber,
		date,
		ISBN,
		defaultPrice,
		freebies,
		chapters,
		hasVariant,
	} = volume;
	const detailsSchema = useMemo(() => {
		if (!volume) return [];

		return [
			{ label: "Autores", value: printArray(serie.authors) },
			{ label: "Número de páginas", value: pagesNumber },
			{ label: "Data de lançamento", value:formatDate(date) },
			{ label: "Preço de capa", value: defaultPrice },
			{ label: "ISBN", value: ISBN },
			{ label: "Capitulos", value: chapters },
			{ label: "Possui Capas variantes", value: hasVariant },
            /*
            //Will uncomment after collecting a decent amount of data for it
			{ label: "Possui brindes", value: freebies.lenght > 0 ? "Sim" : "Não" },
			{
				label: "Brindes",
				value: freebies.lenght > 0 ? printArray(freebies) : null,
			},
            */
		];
	}, [volume]);

	return (
		<div className="container">
			<div className="content-overall__container">
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
				</ul>
			</div>
		</div>
	);
}
