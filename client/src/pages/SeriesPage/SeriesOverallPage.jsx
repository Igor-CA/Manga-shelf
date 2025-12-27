import { useMemo } from "react";
import { printArray } from "./utils";
import SeriesVolumesList from "./SeriesVolumesList";

export default function SeriesOverallPage({ series, volumesState, actions }) {
	const {
		authors,
		publisher,
		genres,
		specs,
		status,
		statusBrazil,
		chaptersCount,
		volumesJapan,
		releaseDateJapan,
		releaseDateBrazil,
		endDateJapan,
		endDateBrasil,
		paperType,
		coverType,
		popularity,
		type,
		demographic,
		volumes,
	} = series;
	const detailsSchema = useMemo(() => {
		if (!series) return [];

		return [
			{ label: "Autores", value: printArray(authors) },
			{ label: "Editora", value: publisher },
			{ label: "Gêneros", value: printArray(genres) },
			{
				label: "Formato",
				value: specs.dimensions
					? `${specs.dimensions.width}cm x ${specs.dimensions.height}cm`.replaceAll(
							".",
							","
					  )
					: null,
			},
			{ label: "Situação no Japão", value: status },
			{ label: "Situação no Brasil", value: statusBrazil },
			{ label: "Quantidade de capítulos", value: chaptersCount },
			{ label: "Volumes no Japão", value: volumesJapan },
			{ label: "Volumes no Brasil", value: volumes.length },
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
			{ label: "Demografia", value: demographic },
		];
	}, [series]);
	const { handleVolumeChange } = actions;

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
					localVolumesList={volumesState}
					handleChange={handleVolumeChange}
				></SeriesVolumesList>
			</div>
		</div>
	);
}
