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
        const fetchUserData = async () => {
            try {
                const response = await fetch(`http://192.168.1.10:3001/api/volume/${id}`);
                const responseData = await response.json();
                console.log(responseData)
                setData(responseData);
            } catch (error) {
                console.error('Error fetching Volume Data:', error);
            }
        };

        fetchUserData();
  }, []);

  return(
    <div className="volume">
        <div className="volume__main-container">
            <img src={data.image} alt={`cover volume ${data.serie.title}`} className="volume__cover" />
            <div className="volume_details-container">
                <h1 className="volume__details">{data.serie.title}  Volume {data.number}</h1>
                <p className="volume__details"><strong>Data de publicação:</strong> {data.date}</p>
                <p className="volume__details"><strong>Páginas:</strong> {data.pagesNumber}</p>
            </div>
        </div>
        <div className="volume__details">
                <strong>Sinopse:</strong>
                {data.summary.map(paragraph => {
                    return(
                        <p className="volume__summary">{paragraph}</p>
                    )
                })}
        </div>
    </div>
  )

}