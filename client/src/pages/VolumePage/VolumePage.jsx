import { useEffect, useState } from "react";
import {  useParams } from "react-router-dom";
import "./VolumePage.css"

export default function VolumePage(){
    const {id} = useParams()
    const [data, setData] = useState( {
        serie: {
            title: ''
        },
        number: '',
        summary: [],
        date: '',
        pagesNumber: '',
        image: ''
    
    })
    
    useEffect(() => {
        const hostOrigin = process.env.REACT_APP_HOST_ORIGIN
        const fetchUserData = async () => {
            try {
                const response = await fetch(`${hostOrigin}/api/volume/${id}`);
                const responseData = await response.json();
                console.log(responseData)
                setData(responseData);
            } catch (error) {
                console.error('Error fetching Volume Data:', error);
            }
        };

        fetchUserData();
  }, []);

  const { image, serie, number, date, pagesNumber, summary } = data;

  return(
    <div className="volume">
        <div className="volume__main-container">
            <img src={image} alt={`cover volume ${serie.title}`} className="volume__cover" />
            <div className="volume_details-container">
                <h1 className="volume__details">{serie.title}  Volume {number}</h1>
                <p className="volume__details"><strong>Data de publicação:</strong> {date}</p>
                <p className="volume__details"><strong>Páginas:</strong> {pagesNumber}</p>
            </div>
        </div>
        <div className="volume__details">
                <strong>Sinopse:</strong>
                { summary.map((paragraph, index) => {
                    return(
                        <p className="volume__summary" key={index}>{paragraph}</p>
                    )
                })}
        </div>
    </div>
  )

}