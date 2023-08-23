import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../../components/userProvider";
export default function MissingVolumesPage(){
    const [seriesVolumesList, setSeriesVolumesList] = useState([])
    const [missingList, setMissingList] = useState([])
    const [user, setUser] = useContext(UserContext)

    useEffect(()=>{
        const fetchVolumesData = async () => {
			try {
				const response = await axios({
                    method: "GET",
                    withCredentials: true,
                    url: `${process.env.REACT_APP_HOST_ORIGIN}/user/missing`,
                });
				console.log(response.data);
				const responseData = response.data;
				setSeriesVolumesList(responseData);
			} catch (error) {
				console.error("Error fetching Series Data:", error);
			}
		};

		fetchVolumesData();
    }, [])

    useEffect(() => {
        if(seriesVolumesList.length > 0){
            const missingVolumesList = seriesVolumesList.filter((volume) => {
                return !user.ownedVolumes.includes(volume.volumeId)
            })
            setMissingList(missingVolumesList)
        }
    },[seriesVolumesList])
    
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