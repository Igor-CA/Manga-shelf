import { useMemo, useRef, useState } from "react";
import { formatDate, printArray } from "../../utils/seriesDataFunctions";
import SeriesVolumesList from "./SeriesVolumesList";
import RelatedCard from "./RelatedCard";
import { Link } from "react-router-dom";
import { FaPencilAlt } from "react-icons/fa";

export default function SeriesOverallPage({ series, volumesState, actions }) {
	const [showingMore, setShowingMore] = useState(false);
	const seriesSummarry = useRef(null);
	const { related, summary } = series;
	const detailsSchema = useMemo(() => {
		if (!series) return [];

		const {
			authors,
			publisher,
			genres,
			specs,
			status,
			popularity,
			type,
			demographic,
			volumes,
			originalRun,
			dates,
		} = series;

		const formattedDimensions =
			specs?.dimensions?.width && specs?.dimensions?.height
				? `${specs.dimensions.width}cm x ${specs.dimensions.height}cm`.replaceAll(
						".",
						",",
					)
				: null;

		const normalVolumes = volumes?.filter((v) => !v.isVariant) || [];
		const variants = volumes?.filter((v) => v.isVariant) || [];
		const variantSuffix =
			variants.length > 0 ? ` + ${variants.length} capas variantes` : "";

		return [
			{ label: "Autores", value: printArray(authors) },
			{ label: "Editora", value: publisher },
			{ label: "Gêneros", value: printArray(genres) },
			{ label: "Tamanho", value: formattedDimensions },
			{ label: "Formato", value: specs?.format },
			{ label: "Demografia", value: demographic },
			{ label: "Papel", value: specs?.paper },
			{ label: "Tipo de capa", value: specs?.cover },
			{ label: "Total de capítulos", value: originalRun?.totalChapters },
			{
				label: `Volumes ${originalRun?.country === "Japão" ? "no" : "na"} ${originalRun?.country || "Japão"}`,
				value: originalRun?.totalVolumes,
			},
			{
				label: "Volumes no Brasil",
				value: normalVolumes.length,
				suffix: variantSuffix,
			},
			{ label: "Tipo", value: type },
			{
				label: "Popularidade",
				value: popularity,
				suffix: " usuários possuem ou querem essa obra",
			},
			{ label: "Situação no Japão", value: originalRun?.status },
			{ label: "Situação no Brasil", value: status },
			{
				label: "Data de lançamento no Japão",
				value: formatDate(originalRun?.dates?.publishedAt),
			},
			{
				label: "Data de lançamento no Brasil",
				value: formatDate(dates?.publishedAt),
			},
			{
				label: "Data de conclusão no Japão",
				value: formatDate(originalRun?.dates?.finishedAt),
			},
			{
				label: "Data de conclusão no Brasil",
				value: formatDate(dates?.finishedAt),
			},
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
					<Link className="button" to={`/submissions/series/${series.id}`}>
						<FaPencilAlt /> Editar informações
					</Link>
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
