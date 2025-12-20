import { useContext } from "react";
import { UserContext } from "../../components/userProvider";
import VolumeItem from "./VolumeItem";

export default function SeriesVolumesList({
	volumes,
	localVolumesList,
	handleChange,
}) {
	const { user } = useContext(UserContext);
	return (
		<ol className="collection-container collection-container--denser">
			{volumes.map((volume) => (
				<li key={volume.volumeId}>
					<VolumeItem
						volumeInfo={volume}
						localVolumeState={localVolumesList}
						handleChange={handleChange}
						user={user}
					/>
				</li>
			))}
		</ol>
	);
}
