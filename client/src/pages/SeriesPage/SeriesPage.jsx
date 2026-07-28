import "./SeriesPage.css";
import { Route, Routes, useParams } from "react-router-dom";
import { Suspense } from "react";
import SeriesPageHeader from "./SeriesPageHeader";
import { LoadingPageComponent } from "../../App";
import SeriesOverallPage from "./SeriesOverallPage";
import { useSeriesLogic } from "./useSeriesLogic";
import SeriesVolumesPage from "./SeriesVolumesPage";
import SeriesRelatedPage from "./SeriesRelatedPage";
import PostsSection from "../../components/posts/PostsSection";
import { useRating } from "../../utils/useRating";
import usePageMeta, { truncate } from "../../utils/usePageMeta";
export default function SeriesPage() {
	const { id } = useParams();

	const {
		series,
		toggleSeriesInList,
		toggleWishlist,
		toggleDrop,
		handleSelectAllVolumes,
		handleVolumeChange,
		handleReadToggle,
		localVolumeState,
	} = useSeriesLogic(id);

	const actions = {
		toggleSeriesInList,
		toggleWishlist,
		toggleDrop,
		handleSelectAllVolumes,
		handleVolumeChange,
		handleReadToggle,
	};

	const volumeScoreValues = series?.myVolumeScores
		? Object.values(series.myVolumeScores)
		: [];
	const derivedSeriesScore =
		volumeScoreValues.length > 0
			? Math.round(
					(volumeScoreValues.reduce((a, b) => a + b, 0) /
						volumeScoreValues.length) *
						10,
				) / 10
			: null;

	usePageMeta(
		series?.title,
		series
			? truncate(series.summary?.[0]) ||
					`Veja todos os volumes de ${series.title} publicados no Brasil, acompanhe o que você já tem e descubra o que falta para completar sua coleção.`
			: null,
	);

	const rating = useRating({
		seriesId: id,
		volumeId: null,
		manualScore: series?.mySeriesScore ?? null,
		derivedScore: derivedSeriesScore,
		average: series?.ratingAverage ?? 0,
		count: series?.ratingCount ?? 0,
	});

	return (
		<div className="page-content" key={id}>
			<SeriesPageHeader
				seriesInfo={series}
				actions={actions}
				rating={rating}
			></SeriesPageHeader>
			{series && (
				<Suspense fallback={<LoadingPageComponent />}>
					<Routes>
						<Route
							path="comments"
							element={<PostsSection seriesId={id} rating={rating} />}
						></Route>
						<Route
							path="related"
							element={<SeriesRelatedPage series={series} />}
						></Route>
						<Route
							path="volumes"
							element={
								<SeriesVolumesPage
									series={series}
									volumesState={localVolumeState}
									actions={actions}
								/>
							}
						></Route>
						<Route
							path=""
							element={
								<SeriesOverallPage
									series={series}
									volumesState={localVolumeState}
									actions={actions}
								/>
							}
						></Route>
					</Routes>
				</Suspense>
			)}
		</div>
	);
}
