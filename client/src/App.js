import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProfilePage from './pages/ProfilePage/ProfilePage';
import SeriesPage from './pages/SeriesPage/SeriesPage';
import "./app.css"
function App() {
  const [userData, setUserData] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const fetchUserData = async () => {
    setLoading(true)
    try {
        const response = await fetch(`http://localhost:3001/admin?p=${page}`);
        console.log(`Fetched page ${page}`)
        const data = await response.json();
        if(data.length > 0){
          setUserData([...userData, ...data]);
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
      fetchUserData();
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll);
  },[loading])
  
  return (
    <div className="App">
      {loading && <p>Carregando...</p>}
      <BrowserRouter>
        <Routes>
          <Route path='/' element={
            <ProfilePage userData={userData}/>}>
          </Route>
          <Route path='/series/:id'element = {<SeriesPage/>}></Route>
        </Routes>
      </BrowserRouter>
    
    </div>
  );
}

export default App;
