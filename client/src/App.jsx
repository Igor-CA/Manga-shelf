import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useContext, useEffect, lazy, Suspense } from "react";
import { UserContext } from "./components/userProvider";
import NavBar from "./components/NavBar";
import ScrollToTop from "./utils/ScrollToTop";
import MessageComponent from "./components/MessageComponent";
import "./App.css";
import axios from "axios";

// Lazy-loaded page components
const SeriesPage = lazy(() => import("./pages/SeriesPage/SeriesPage"));
const VolumePage = lazy(() => import("./pages/VolumePage/VolumePage"));
const SignupPage = lazy(() => import("./pages/AuthenticationPage/SignupPage"));
const LoginPage = lazy(() => import("./pages/AuthenticationPage/LoginPage"));
const UserPage = lazy(() => import("./pages/UserPage/UserPage"));
const BrowsePage = lazy(() => import("./pages/BrowsePage/BrowsePage"));
const ForgotPage = lazy(() => import("./pages/AuthenticationPage/ForgotPage"));
const ResetPasswordPage = lazy(() => import("./pages/AuthenticationPage/ResetPasswordPage"));
const ReportProblem = lazy(() => import("./pages/ReportPoblem/ReportProblem"));
const Home = lazy(() => import("./pages/Home/Home"));
const DonatePage = lazy(() => import("./pages/Donate/DonatePage"));
const AboutPage = lazy(() => import("./pages/About/AboutPage"));
const NotFound = lazy(() => import("./pages/404Page/NotFound"));
const ToSPage = lazy(() => import("./pages/Tos/ToSPage"));
const LogoutPage = lazy(() => import("./pages/AuthenticationPage/LogoutPage"));
const UserNameModal = lazy(() => import("./pages/AuthenticationPage/UserNameModal"));
const BrowseUser = lazy(() => import("./pages/BrowsePage/BrowseUser"))

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
							Authorization: import.meta.env.REACT_APP_API_KEY,
						},
						url: `${
							import.meta.env.REACT_APP_HOST_ORIGIN
						}/api/data/user/logged-user`,
					});
					if (res.data.msg) return;

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
			<BrowserRouter
				future={{
					v7_startTransition: true,
					v7_relativeSplatPath: true,
				}}
			>
				<NavBar></NavBar>
				<ScrollToTop />
				{user && user?.username === undefined && (
					<UserNameModal>precisa setar nome</UserNameModal>
				)}
				<Suspense fallback={<h1>Loading...</h1>}>
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
						<Route path="/browse/user" element={<BrowseUser />}></Route>
						<Route path="/donate" element={<DonatePage />}></Route>
						<Route path="/about" element={<AboutPage />}></Route>
						<Route path="/series/:id" element={<SeriesPage />}></Route>
						<Route path="/volume/:id" element={<VolumePage />}></Route>
						<Route path="/user/:username/*" element={<UserPage />}></Route>
						<Route path="*" element={<NotFound />}></Route>
					</Routes>
				</Suspense>

				<footer className="footer">
					{user ? (
						<Link to="/logout">Sair</Link>
					) : (
						<Link to="/login">Logar</Link>
					)}
					<Link to="/about">Sobre nós</Link>
					<Link to="/donate">Apoie o projeto</Link>
				</footer>
				<MessageComponent></MessageComponent>
			</BrowserRouter>
		</div>
	);
}

export default App;
