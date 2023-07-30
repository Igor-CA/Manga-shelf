import React, { useState, useEffect } from 'react';
import { SeriesCard } from "../../components/SeriesCard"

export default function AdminPage(){
  const [seriesData, setSeriesData] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  
  const fetchSeriesData = async () => {
    setLoading(true)
    try {
        const response = await fetch(`http://192.168.1.10:3001/admin?p=${page}`);
        console.log(`Fetched page ${page}`)
        const data = await response.json();
        if(data.length > 0){
          setSeriesData([...seriesData, ...data]);
          setLoading(false);
          setPage(page + 1);
        }
    } catch (error) {
        console.error('Error fetching user Data:', error);
    }
  };

  const handleScroll = () => {

    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const contentHeight = document.documentElement.offsetHeight;

    const bottomOffset = contentHeight - (scrollY + windowHeight);
    const loadMoreThreshold = 200; // Adjust this value as needed

    if (bottomOffset < loadMoreThreshold && !loading) {
      fetchSeriesData();
    }
  };

  useEffect(() => {
    fetchSeriesData();
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll);
  },[loading])

    return(
      <div className='collection-container'>
        {loading && <p>Carregando...</p>}
        {seriesData.map(series => {
          //console.log(series._id)
          return(
            <SeriesCard key={series._id} seriesDetails={{title:series.title, image:series.image, id:series._id}} ></SeriesCard>
          )
        })}
      </div>
    )
}