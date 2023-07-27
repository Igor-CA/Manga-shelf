import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function SeriesPage(){
    const {id} = useParams()
    const [data, setData] = useState({
        title: '',
        publisher: '',
        authors: '',
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
    <div>
        <h1>{data.title}</h1>
        <strong>Publisher: {data.publisher}</strong>
        <strong>Authors: {data.authors}</strong>
        <img src={data.SeriesCover} alt="" />
        <ol>
            {data.volumes.map(volume => {
                return(
                    <li key={volume.volumeId}>
                        <strong>Volume {volume.volumeNumber}</strong>
                        <img src={volume.image} alt="" />
                    </li>
                )
            })}
        </ol>
    </div>
  )

}