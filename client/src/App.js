import { BrowserRouter, Routes, Route } from "react-router-dom";
import SeriesPage from './pages/SeriesPage/SeriesPage';
import "./app.css"
import VolumePage from './pages/VolumePage/VolumePage';
import AdminPage from './pages/AdminPage/AdminPage';
import SignupPage from './pages/AuthenticationPage/SignupPage';
import LoginPage from './pages/AuthenticationPage/LoginPage';
function App() {
  //const [user, setUser] = useState()
  
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
