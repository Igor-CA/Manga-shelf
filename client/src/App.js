import { BrowserRouter, Routes, Route } from "react-router-dom";
import SeriesPage from './pages/SeriesPage/SeriesPage';
import "./app.css"
import VolumePage from './pages/VolumePage/VolumePage';
import AdminPage from './pages/AdminPage/AdminPage';
import SignupPage from './pages/AuthenticationPage/SignupPage';
import LoginPage from './pages/AuthenticationPage/LoginPage';
import axios from "axios"
import { UserContext } from "./components/userProvider";
import { useContext, useEffect } from "react";
function App() {
  const [user, setUser] = useContext(UserContext)
  
  
  useEffect(() => {
    const querryUser = async() => {
      const res = await axios({
        method: "GET",
        withCredentials: true,
        url: "http://localhost:3001/user/data"
      })
      console.log('querryed')
      setUser(res.data)
    }
    if(!user){
      querryUser()
    }
  }, [user])
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<AdminPage/>}></Route>
          <Route path='/signup' element = {<SignupPage/>}></Route>
          <Route path='/login' element = {<LoginPage/>}></Route>
          <Route path='/series/:id' element = {<SeriesPage/>}></Route>
          <Route path='/volume/:id' element = {<VolumePage/>}></Route>
        </Routes>
      </BrowserRouter>
    
    </div>
  );
}

export default App;
