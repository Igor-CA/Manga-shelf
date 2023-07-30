import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProfilePage from './pages/ProfilePage/ProfilePage';
import SeriesPage from './pages/SeriesPage/SeriesPage';
import "./app.css"
import VolumePage from './pages/VolumePage/VolumePage';
import AdminPage from './pages/AdminPage/AdminPage';
function App() {
  
  
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path='/' element={
            <AdminPage/>}>
          </Route>
          <Route path='/series/:id'element = {<SeriesPage/>}></Route>
          <Route path='/volume/:id'element = {<VolumePage/>}></Route>
        </Routes>
      </BrowserRouter>
    
    </div>
  );
}

export default App;
