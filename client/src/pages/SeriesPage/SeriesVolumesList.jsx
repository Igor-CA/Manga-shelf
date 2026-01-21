import { useContext } from "react";
import { UserContext } from "../../contexts/userProvider";
import VolumeItem from "./VolumeItem";

export default function SeriesVolumesList({
	volumes,
	localVolumesList,
	handleChange,
	handleReadToggle,
	dense = true,
}) {
	const { user } = useContext(UserContext);
	const normalVolumes = volumes.filter((volume) => !volume.isVariant);
	const variants = volumes.filter((volume) => volume.isVariant);
	return (
		<div>
			<ol
				className={`collection-container ${
					dense === true && "collection-container--denser"
				}`}
			>
				{normalVolumes.map((volume) => (
					<li key={volume.volumeId}>
						<VolumeItem
							volumeInfo={volume}
							localVolumeState={localVolumesList}
							handleChange={handleChange}
							handleReadToggle={handleReadToggle}
							user={user}
						/>
					</li>
				))}
			</ol>
			{variants.length > 0 && (
				<>
					<hr style={{ margin: "0px 10px" }} />
					<h2 className="collection-lable">Capas Variantes</h2>
					<ol
						className={`collection-container ${
							dense === true && "collection-container--denser"
						}`}
					>
						{variants.map((volume) => (
							<li key={volume.volumeId}>
								<VolumeItem
									volumeInfo={volume}
									localVolumeState={localVolumesList}
									handleChange={handleChange}
									handleReadToggle={handleReadToggle}
									user={user}
								/>
							</li>
						))}
					</ol>
				</>
			)}
		</div>
	);
}
