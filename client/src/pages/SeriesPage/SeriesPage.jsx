import "./SeriesPage.css";
import { Route, Routes, useParams } from "react-router-dom";
import { Suspense } from "react";
import SeriesPageHeader from "./SeriesPageHeader";
import { LoadingPageComponent } from "../../App";
import SeriesOverallPage from "./SeriesOverallPage";
import { useSeriesLogic } from "./useSeriesLogic";
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

	return (
		<div className="page-content" key={id}>
			<SeriesPageHeader
				seriesInfo={series}
				actions={actions}
			></SeriesPageHeader>
			{series && (
				<Suspense fallback={<LoadingPageComponent />}>
					<Routes>
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
