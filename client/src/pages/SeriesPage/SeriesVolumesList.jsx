import { useContext } from "react";
import { UserContext } from "../../components/userProvider";
import VolumeItem from "./VolumeItem";

export default function SeriesVolumesList({
	volumes,
	infoToShow = "volumes",
	localVolumesList,
	handleChange,
}) {
	const { user } = useContext(UserContext);
	return (
		<ol
			className={`series__volumes-container mobile-appearence ${
				infoToShow !== "volumes" ? "" : "mobile-appearence--show"
			}`}
		>
			{volumes.map((volume) => (
				<VolumeItem
					key={volume.volumeId}
					volumeInfo={volume}
					localVolumeState={localVolumesList}
					handleChange={handleChange}
					user={user}
				/>
			))}
		</ol>
	);
}
