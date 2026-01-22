import RelatedCard from "./RelatedCard";

export default function SeriesRelatedPage({ series }) {
	const { related } = series;

	return (
		<div className="container">
			<div className="content-overall__container">
				<div className="overall-content__container">
					<hr style={{ margin: "0px 10px" }} />
					<h2 className="collection-lable">Obras relacionadas</h2>
					{related && related.length > 0 ? (
						<>
							<ul className="related-cards__container related-cards__cotnainer--fullpage">
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
					):<p className="related__missing">Ainda não registramos nenhuma obra relacionada a este título. Caso você conheça alguma conexão (como continuação, spin-off, databook ou do mesmo autor), por favor, nos avise na página de feedback.</p>}
				</div>
			</div>
		</div>
	);
}
