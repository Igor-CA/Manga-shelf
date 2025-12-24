import "./SeriesPageRedesign.css";
import { Route, Routes, useParams } from "react-router-dom";
import { Suspense } from "react";
import SeriesPageHeader from "./SeriesPageHeader";
import { LoadingPageComponent } from "../../App";
import SeriesOverallPage from "./SeriesOverallPage";
import { useSeriesLogic } from "./useSeriesLogic";
export default function SeriesPageRedesign() {
	const { id } = useParams();

	const {
		series,
		toggleSeriesInList,
		toggleWishlist,
		toggleDrop,
		handleSelectAllVolumes,
		handleVolumeChange,
		localVolumeState,
	} = useSeriesLogic(id);

	const actions = {
		toggleSeriesInList,
		toggleWishlist,
		toggleDrop,
		handleSelectAllVolumes,
		handleVolumeChange
	};

	return (
		<div className="page-content" key={id}>
			{series && (
				<>
					<SeriesPageHeader
						seriesInfo={series}
						actions={actions}
					></SeriesPageHeader>
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
				</>
			)}
		</div>
	);
}
