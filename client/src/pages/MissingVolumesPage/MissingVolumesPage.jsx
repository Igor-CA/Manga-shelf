import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { UserContext } from "../../components/userProvider";
export default function MissingVolumesPage(){
    const {username} = useParams()
    const [seriesVolumesList, setSeriesVolumesList] = useState([])
    const [missingList, setMissingList] = useState([])
    const [user, setUser] = useState();

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
				setSeriesVolumesList(responseData);
			} catch (error) {
				console.error("Error fetching Series Data:", error);
			}
		};
        const querryUser = async () => {
			try {
				const res = await axios({
					method: "GET",
					withCredentials: true,
					url: `${process.env.REACT_APP_HOST_ORIGIN}/api/user/${username}`,
				});
				console.log(res.data);
				setUser(res.data);

			} catch (error) {
				console.log(error);
			}
		};
        
		querryUser();
		fetchVolumesData();
    }, [])

    useEffect(() => {
        if(seriesVolumesList.length > 0 && user){
            console.log({user,seriesVolumesList})
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