import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import SeriesPage from "./pages/SeriesPage/SeriesPage";
import "./app.css";
import VolumePage from "./pages/VolumePage/VolumePage";
import AdminPage from "./pages/AdminPage/AdminPage";
import SignupPage from "./pages/AuthenticationPage/SignupPage";
import LoginPage from "./pages/AuthenticationPage/LoginPage";
import UserPage from "./pages/UserPage/UserPage";
import NavBar from "./components/NavBar";
import BrowsePage from "./pages/BrowsePage/BrowsePage";
import MissingVolumesPage from "./pages/MissingVolumesPage/MissingVolumesPage";
function App() {

	return (
		<div className="App">
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<BrowsePage />}></Route>
					<Route path="/profile" element={<UserPage />}></Route>
					<Route path="/browse" element={<BrowsePage />}></Route>
					<Route path="/signup" element={<SignupPage />}></Route>
					<Route path="/login" element={<LoginPage />}></Route>
					<Route path="/missing" element={<MissingVolumesPage />}></Route>
					<Route path="/series/:id" element={<SeriesPage />}></Route>
					<Route path="/volume/:id" element={<VolumePage />}></Route>
				</Routes>
				<NavBar></NavBar>
			</BrowserRouter>
		</div>
	);
}

export default App;
