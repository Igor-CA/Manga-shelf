import { useMemo, useRef, useState } from "react";
import { printArray } from "./utils";
import SeriesVolumesList from "./SeriesVolumesList";
import RelatedCard from "./RelatedCard";

export default function SeriesOverallPage({ series, volumesState, actions }) {
	const [showingMore, setShowingMore] = useState(false);
	const seriesSummarry = useRef(null);
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
		related,
		summary,
	} = series;
	const normalVolumes = volumes.filter((v) => !v.isVariant);
	const variants = volumes.filter((v) => v.isVariant);
	const detailsSchema = useMemo(() => {
		if (!series) return [];

		return [
			{ label: "Autores", value: printArray(authors) },
			{ label: "Editora", value: publisher },
			{ label: "Gêneros", value: printArray(genres) },
			{
				label: "Formato",
				value:
					specs?.dimensions?.width && specs?.dimensions?.height
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
			{
				label: "Volumes no Brasil",
				value: normalVolumes.length,
				suffix:
					variants.length > 0 ? ` + ${variants.length} capas variantes` : "",
			},
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
	const { handleVolumeChange, handleReadToggle } = actions;

	return (
		<div className="container">
			<div className="content-overall__container">
				{summary?.length > 0 && (
					<div className="content__details-summary content__details-summary--mobile">
						<strong>Sinopse:</strong>
						<div
							ref={seriesSummarry}
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
				</ul>
				<div className="overall-content__container">
					{related && related.length > 0 && (
						<>
							<hr style={{ margin: "0px 10px" }} />
							<h2 className="collection-lable">Obras relacionadas</h2>
							<ul className="related-cards__container">
								{related.map((series) => {
									return (
										<RelatedCard
											key={series.seriesId}
											relatedSeries={series}
										></RelatedCard>
									);
								})}
							</ul>
						</>
					)}
					<hr style={{ margin: "0px 10px" }} />
					<h2 className="collection-lable">Volumes</h2>
					<SeriesVolumesList
						volumes={series.volumes}
						localVolumesList={volumesState}
						handleChange={handleVolumeChange}
						handleReadToggle={handleReadToggle}
					></SeriesVolumesList>
				</div>
			</div>
		</div>
	);
}
