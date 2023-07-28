import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./SeriesPage.css"

export default function SeriesPage(){
    const {id} = useParams()
    const [data, setData] = useState({
        title: '',
        publisher: '',
        authors: '',
        seriesCover: '',
        volumes: []
    })
    
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch(`http://localhost:3001/api/series/${id}`);
                console.log(response)
                const responseData = await response.json();
                setData(responseData);
            } catch (error) {
                console.error('Error fetching Series Data:', error);
            }
        };

        fetchUserData();
  }, []);

  return(
    <div className="series">
        <div className="series__info-container">
            <img src={data.seriesCover} alt={`cover volume ${data.title}`} className="series__cover" />
            <div className="series_details-container">
                <h1 className="series__details">{data.title}</h1>
                <strong className="series__details">Publisher: {data.publisher}</strong>
                <strong className="series__details">Authors: {data.authors}</strong>
            </div>
        </div>
        <ol className="series__volumes-container">
            {data.volumes.map(volume => {
                return(
                    <li key={volume.volumeId} className="series__volume-item">
                        <img src={volume.image} alt={`cover volume ${volume.volumeNumber}`} className="series__volume__image" />
                        <Link className="series__volume__number"><strong>Volume {volume.volumeNumber}</strong></Link>
                        <div>
                            <label htmlFor="have-volume-check-mark" className="checkmark-label">Tem:</label>
                            <input type="checkbox" name="have-volume-check-mark" className="checkmark"/>
                        </div>                
                    </li>
                )
            })}
        </ol>
    </div>
  )

}