
import SeriesVolumesList from "./SeriesVolumesList";

export default function SeriesVolumesPage({ series, volumesState, actions }) {
	const { handleVolumeChange, handleReadToggle } = actions;

	return (
		<div className="container">
			<div className="content-overall__container">
				<div className="overall-content__container">
					<hr style={{ margin: "0px 10px" }} />
					<h2 className="collection-lable">Volumes</h2>
					<SeriesVolumesList
						volumes={series.volumes}
						localVolumesList={volumesState}
						handleChange={handleVolumeChange}
						handleReadToggle={handleReadToggle}
						dense={false}
					></SeriesVolumesList>
				</div>
			</div>
		</div>
	);
}
