import { SeriesCard } from "./SeriesCard";

export default function SeriesCardList({ list, lastSeriesElementRef }) {
	return (
		<div className="collection-container">
			{list.map((series, index) => {
				return (
					<div
						key={series._id}
						ref={index === list.length - 1 ? lastSeriesElementRef : undefined}
					>
						<SeriesCard seriesDetails={series}></SeriesCard>
					</div>
				);
			})}
		</div>
	);
}
