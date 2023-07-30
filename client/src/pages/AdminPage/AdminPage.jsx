import React, { useState, useEffect, useCallback } from 'react';
import { SeriesCard } from "../../components/SeriesCard"
import "./AdminPage.css"
import debaunce from '../../utils/debaunce';

export default function AdminPage(){
  const [search, setSearch] = useState('')
  const [seriesData, setSeriesData] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  
  const fetchSeriesData = async () => {
    setLoading(true)
    try {
        const response = await fetch(`http://192.168.1.10:3001/admin?p=${page}`);
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

  const fetchSearch = async(querry) => {
    setLoading(true)
    try {
        let response
        if(querry !== ''){
          response = await fetch(`http://192.168.1.10:3001/api/search?q=${querry}`);
        }
        else{
          setSeriesData([])
          setPage(1)
          response = await fetch(`http://192.168.1.10:3001/admin?p=${page}`)
        }
        console.log(`Fetched querry data ${querry}`)
        const data = await response.json();
        if(data.length > 0){
          setSeriesData([ ...data]);
          setLoading(false);
        }
    } catch (error) {
        console.error('Error fetching user Data:', error);
    }
  }

  const debaunceSearch = useCallback(debaunce((search) => {fetchSearch(search)}, 250), [])

  const handleScroll = () => {

    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const contentHeight = document.documentElement.offsetHeight;

    const bottomOffset = contentHeight - (scrollY + windowHeight);
    const loadMoreThreshold = 200; // Adjust this value as needed

    if (bottomOffset < loadMoreThreshold && !loading && search === '') {
      fetchSeriesData();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log(search)
    fetchSearch()
  }

  const handleChange = (e) => {
    const inputValue = e.target.value
    setSearch(inputValue)
    debaunceSearch(inputValue)
  }

  useEffect(() => {
    fetchSeriesData();
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll);
  },[loading])

    return(
      <div className='browse-collection-page'>
        <form className='form' onSubmit={(e) => handleSubmit(e)}>
          <label htmlFor="search-bar" className='form__label'>Pesquisa</label>
          <input 
            type="text" 
            name="search-bar" 
            className='form__input'
            onChange={(e) => {handleChange(e)}}
            value={search}
          />
        </form>
        {loading && <p>Carregando...</p>}
        <div className='collection-container'>
          {seriesData.map(series => {
            //console.log(series._id)
            return(
              <SeriesCard key={series._id} seriesDetails={{title:series.title, image:series.image, id:series._id}} ></SeriesCard>
            )
          })}
        </div>
      </div>
    )
}