import { useState } from "react";
import { useParams } from "react-router-dom";
import "./SeriesPage.css";
import SeriesInfoCard from "./SeriesInfoCard";
import SeriesVolumesList from "./SeriesVolumesList";
import SkeletonPage from "../../components/SkeletonPage";
import SkeletonVolumesList from "./SkeletonVolumesList";
import { useSeriesLogic } from "./useSeriesLogic";

export default function SeriesPage() {
	const { id } = useParams();
	const [infoToShow, setInfoToShow] = useState("details");

	const {
		series,
		localVolumeState,
		handleVolumeChange,
		handleSelectAllVolumes,
		toggleSeriesInList,
		toggleWishlist,
		toggleDrop,
	} = useSeriesLogic(id);

	if (!series) {
		return (
			<div className="container page-content">
				<SkeletonPage type="Series" />
				<div
					className={`series__volumes-container mobile-appearence ${
						infoToShow === "volumes" ? "mobile-appearence--show" : ""
					}`}
				>
					<SkeletonVolumesList count={12} />
				</div>
			</div>
		);
	}

	return (
		<div className="container page-content">
			<SeriesInfoCard
				seriesInfo={series}
				localVolumeList={localVolumeState}
				actions={{
					toggleSeriesInList,
					toggleWishlist,
					toggleDrop,
					handleSelectAllVolumes,
				}}
				infoToShow={infoToShow}
				setInfoToShow={setInfoToShow}
			/>
			<SeriesVolumesList
				volumes={series.volumes}
				infoToShow={infoToShow}
				localVolumesList={localVolumeState}
				handleChange={handleVolumeChange}
			/>
		</div>
	);
}