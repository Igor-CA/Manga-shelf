import { SeriesCard } from "./SeriesCard";
import { SkeletonSeriesCard } from "./SkeletonSeriesCard";

export default function SeriesCardList({
	list,
	lastSeriesElementRef,
	skeletonsCount,
}) {
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
			{skeletonsCount && Array(skeletonsCount)
				.fill()
				.map((_, id) => {
					return <SkeletonSeriesCard key={id}></SkeletonSeriesCard>;
				})}
		</div>
	);
}
