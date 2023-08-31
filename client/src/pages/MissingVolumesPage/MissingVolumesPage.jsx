import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
export default function MissingVolumesPage(){
    const {username} = useParams()
    const [missingList, setMissingList] = useState([])

    useEffect(()=>{
        const fetchVolumesData = async () => {
			try {
				const response = await axios({
                    method: "GET",
                    withCredentials: true,
                    url: `${process.env.REACT_APP_HOST_ORIGIN}/api/user/${username}/missing`,
                });
				console.log(response.data);
				const responseData = response.data;
				setMissingList(responseData);
			} catch (error) {
				console.error("Error fetching Series Data:", error);
			}
		};
		fetchVolumesData();
    }, [])

    const renderVolumeItem = (volume) => {
		const { series, volumeId, image, volumeNumber } = volume;
		return (
			<li key={volumeId} className="series__volume-item">
				<img
					src={image}
					alt={`cover volume ${volumeNumber}`}
					className="series__volume__image"
				/>
				<Link to={`../volume/${volumeId}`} className="series__volume__number">
					<strong>{series} - Volume {volumeNumber}</strong>
				</Link>
			</li>
		);
	};

    return(
        <ol className="missing-volumes-container">
            {missingList.map((volume) => renderVolumeItem(volume))}
        </ol>
    )
}