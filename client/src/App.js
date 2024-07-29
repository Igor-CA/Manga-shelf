import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useContext, useEffect } from "react";
import { UserContext } from "./components/userProvider";
import SeriesPage from "./pages/SeriesPage/SeriesPage";
import "./App.css";
import VolumePage from "./pages/VolumePage/VolumePage";
import axios from "axios";
import SignupPage from "./pages/AuthenticationPage/SignupPage";
import LoginPage from "./pages/AuthenticationPage/LoginPage";
import UserPage from "./pages/UserPage/UserPage";
import NavBar from "./components/NavBar";
import BrowsePage from "./pages/BrowsePage/BrowsePage";
import ForgotPage from "./pages/AuthenticationPage/ForgotPage";
import ResetPasswordPage from "./pages/AuthenticationPage/ResetPasswordPage";
import ReportProblem from "./pages/ReportPoblem/ReportProblem";
import Home from "./pages/Home/Home";
import DonatePage from "./pages/Donate/DonatePage";
import AboutPage from "./pages/About/AboutPage";
import NotFound from "./pages/404Page/NotFound";
import ToSPage from "./pages/Tos/ToSPage";
import ScrollToTop from "./utils/ScrollToTop";
import LogoutPage from "./pages/AuthenticationPage/LogoutPage";
function App() {
	const { user, setUser, outdated, setOutdated } = useContext(UserContext);

	useEffect(() => {
		if (outdated) {
			const querryUser = async () => {
				try {
					const res = await axios({
						method: "GET",
						withCredentials: true,
						headers: {
							Authorization:process.env.REACT_APP_API_KEY,
						},
						url: `/api/data/user/logged-user`,
					});
					if(res.data.msg) return
					
					setUser(res.data);
					setOutdated(false);
				} catch (error) {
					console.log(error);
				}
			};
			querryUser();
		}
	}, [outdated]);

	return (
		<div className="App">
			<BrowserRouter>
				<NavBar></NavBar>
				<ScrollToTop />
				<Routes>
					<Route path="/" element={<Home />}></Route>
					<Route path="/signup" element={<SignupPage />}></Route>
					<Route path="/tos" element={<ToSPage />}></Route>
					<Route path="/login" element={<LoginPage />}></Route>
					<Route path="/logout" element={<LogoutPage />}></Route>
					<Route path="/forgot" element={<ForgotPage />}></Route>
					<Route
						path="/reset/:userId/:token"
						element={<ResetPasswordPage />}
					></Route>
					<Route path="/feedback" element={<ReportProblem />}></Route>
					<Route path="/browse" element={<BrowsePage />}></Route>
					<Route path="/donate" element={<DonatePage />}></Route>
					<Route path="/about" element={<AboutPage />}></Route>
					<Route path="/series/:id" element={<SeriesPage />}></Route>
					<Route path="/volume/:id" element={<VolumePage />}></Route>
					<Route path="/user/:username/*" element={<UserPage />}></Route>
					<Route path="*" element={<NotFound />}></Route>
				</Routes>

				<footer className="footer">
					{user ? (
						<Link  to="/logout">Sair</Link>
					) : (
						<Link to="/login">Logar</Link>
					)}
					<Link to="/about">Sobre nós</Link>
					<Link to="/donate">Apoie o projeto</Link>
				</footer>
			</BrowserRouter>
		</div>
	);
}

export default App;
