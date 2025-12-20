import { useMemo, useState } from "react";
import { printArray } from "./utils";
import SeriesVolumesList from "./SeriesVolumesList";

export default function SeriesOverallPage({ series }) {
	const [localVolumeState, setLocalVolumeState] = useState();
	const {
		authors,
		publisher,
		genres,
		dimmensions,
		statusJapan,
		statusBrazil,
		chaptersCount,
		volumesJapan,
		volumesBrazil,
		releaseDateJapan,
		releaseDateBrazil,
		endDateJapan,
		endDateBrasil,
		paperType,
		coverType,
		popularity,
		type,
		demographics,
	} = series;
	const detailsSchema = useMemo(() => {
		if (!series) return [];

		return [
			{ label: "Autores", value: printArray(authors) },
			{ label: "Editora", value: publisher },
			{ label: "Gêneros", value: printArray(genres) },
			{ label: "Formato", value: dimmensions?.join("cm x ") + "cm" },
			{ label: "Situação no Japão", value: statusJapan },
			{ label: "Situação no Brasil", value: statusBrazil },
			{ label: "Quantidade de capítulos", value: chaptersCount },
			{ label: "Volumes no Japão", value: volumesJapan },
			{ label: "Volumes no Brasil", value: volumesBrazil },
			{ label: "Data de lançamento no Japão", value: releaseDateJapan },
			{ label: "Data de lançamento no Brasil", value: releaseDateBrazil },
			{ label: "Data de conclusão no Japão", value: endDateJapan },
			{ label: "Data de conclusão no Brasil", value: endDateBrasil },
			{ label: "Tipo de papel", value: paperType },
			{ label: "Tipo de capa", value: coverType },
			{
				label: "Popularidade",
				value: popularity,
				suffix: " usuários possuem ou querem essa obra",
			},
			{ label: "Tipo", value: type },
			{ label: "Demografia", value: demographics },
		];
	}, [series]);

	const handleChange = () => {
		console.log("change");
	};
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
				<SeriesVolumesList
					volumes={series.volumes}
					localVolumesList={localVolumeState}
					handleChange={handleChange}
				></SeriesVolumesList>
			</div>
		</div>
	);
}
