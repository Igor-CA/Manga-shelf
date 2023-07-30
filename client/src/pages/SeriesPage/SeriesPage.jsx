import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./SeriesPage.css"

export default function SeriesPage(){
    const {id} = useParams()
    const [data, setData] = useState({
        title: '',
        publisher: '',
        authors: [],
        seriesCover: '',
        volumes: []
    })
    
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch(`http://192.168.1.10:3001/api/series/${id}`);
                console.log(response)
                const responseData = await response.json();
                console.log(responseData.authors)
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
                <p  className="series__details"><strong>Editora:</strong> {data.publisher}</p>
                <p className="series__details"><strong>Autores:</strong> {data.authors.map((author, index) => {
                    console.log(data.authors.length, index)
                    if(data.authors.length === (index+1)) return `${author}`
                    else if(data.authors.length-1 === (index+1)) return `${author} e `
                    return `${author}, `
                })}</p>
            </div>
        </div>
        <ol className="series__volumes-container">
            {data.volumes.map(volume => {
                return(
                    <li key={volume.volumeId} className="series__volume-item">
                        <img src={volume.image} alt={`cover volume ${volume.volumeNumber}`} className="series__volume__image" />
                        <Link to={`../volume/${volume.volumeId}`} className="series__volume__number"><strong>Volume {volume.volumeNumber}</strong></Link>
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