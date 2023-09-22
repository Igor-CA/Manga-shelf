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
function App() {
	const { user, setUser, outdated, setOutdated } = useContext(UserContext);

	useEffect(() => {
		console.log({ user, setUser, outdated, setOutdated });
		if (outdated) {
			const querryUser = async () => {
				try {
					const res = await axios({
						method: "GET",
						withCredentials: true,
						url: `${process.env.REACT_APP_HOST_ORIGIN}/api/user/logged-user`,
					});
					console.log(res.data);
					setUser(res.data);
					setOutdated(false);
				} catch (error) {
					console.log(error);
				}
			};
			querryUser();
		}
	}, [outdated]);

	const logout = async () => {
		try {
			const res = await axios({
				method: "GET",
				withCredentials: true,
				url: `${process.env.REACT_APP_HOST_ORIGIN}/user/logout`,
			});
			setOutdated(true);
			window.location.href = '/'
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<div className="App">
			<BrowserRouter>
				<NavBar logout={logout}></NavBar>
				<Routes>
					<Route path="/" element={<Home />}></Route>
					<Route path="/signup" element={<SignupPage />}></Route>
					<Route path="/login" element={<LoginPage />}></Route>
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
						<Link onClick={logout}>Sair</Link>
					) : (
						<Link to="/login">Logar</Link>
					)}
					<Link to="/about">Sobre nós</Link>
					<Link to="/donate">Apoie o projeto</Link>
					<Link to="/contacts">Contact us</Link>
				</footer>
			</BrowserRouter>
		</div>
	);
}

export default App;
