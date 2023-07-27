import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProfilePage from './pages/ProfilePage/ProfilePage';
import SeriesPage from './pages/SeriesPage/SeriesPage';
import "./app.css"

function App() {
  const [userData, setUserData] = useState([])

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch('http://localhost:3001/admin');
                const data = await response.json();
                setUserData(data);
            } catch (error) {
                console.error('Error fetching user Data:', error);
            }
        };

        fetchUserData();
  }, []);
  
  return (
    <div className="App">
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
