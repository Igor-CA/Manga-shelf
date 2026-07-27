import {
	BrowserRouter,
	Routes,
	Route,
	Link,
	useNavigate,
} from "react-router-dom";
import { useContext, useEffect, lazy, Suspense } from "react";
import { UserContext } from "./contexts/userProvider";
import NavBar from "./components/navbars/NavBar";
import ScrollToTop from "./utils/ScrollToTop";
import MessageComponent from "./contexts/MessageComponent";
import RequireAuth from "./components/RequireAuth";
import ErrorBoundary from "./components/ErrorBoundary";
import { consume } from "./utils/returnTo";
import "./App.css";
import AdultPageRedirect from "./pages/AdultPageRedirect/AdultPageRedirect";

// Lazy-loaded page components
const SeriesPage = lazy(() => import("./pages/SeriesPage/SeriesPage"));
const VolumePage = lazy(() => import("./pages/VolumePage/VolumePage"));
const SignupPage = lazy(() => import("./pages/AuthenticationPage/SignupPage"));
const LoginPage = lazy(() => import("./pages/AuthenticationPage/LoginPage"));
const UserPage = lazy(() => import("./pages/UserPage/UserPage"));
const BrowsePage = lazy(() => import("./pages/BrowsePage/BrowsePage"));
const ForgotPage = lazy(() => import("./pages/AuthenticationPage/ForgotPage"));
const ResetPasswordPage = lazy(
	() => import("./pages/AuthenticationPage/ResetPasswordPage"),
);
const ReportProblem = lazy(() => import("./pages/ReportPoblem/ReportProblem"));
const Home = lazy(() => import("./pages/Home/Home"));
const DonatePage = lazy(() => import("./pages/Donate/DonatePage"));
const AboutPage = lazy(() => import("./pages/About/AboutPage"));
const NotFound = lazy(() => import("./pages/404Page/NotFound"));
const ToSPage = lazy(() => import("./pages/Tos/ToSPage"));
const PrivacyPage = lazy(() => import("./pages/Privacy/PrivacyPage"));
const LogoutPage = lazy(() => import("./pages/AuthenticationPage/LogoutPage"));
const UserNameModal = lazy(
	() => import("./pages/AuthenticationPage/UserNameModal"),
);
const BrowseUser = lazy(() => import("./pages/BrowsePage/BrowseUser"));
const SettingsPage = lazy(() => import("./pages/Settings/SettingsPage"));
const NotificationsPage = lazy(
	() => import("./pages/Notifications/NotificationsPage"),
);
const SeriesSubmissionPage = lazy(
	() => import("./pages/SubmissionsPage/SeriesSubmissionPage"),
);
const VolumeSubmissionPage = lazy(
	() => import("./pages/SubmissionsPage/VolumesSubmissionPage"),
);
const AdminDashboard = lazy(() => import("./pages/AdminPages/AdminDashboard"));
const CommentThreadPage = lazy(
	() => import("./pages/CommentThread/CommentThreadPage"),
);

export const LoadingPageComponent = () => {
	return (
		<div className="page-content">
			<div className="loading-page__bar"></div>
		</div>
	);
};

const AuthReturnConsumer = () => {
	const { user } = useContext(UserContext);
	const navigate = useNavigate();

	useEffect(() => {
		if (!user) return;
		const dest = consume();
		if (dest) navigate(dest, { replace: true });
	}, [user]);

	return null;
};

function App() {
	const { user } = useContext(UserContext);

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
				<AuthReturnConsumer />
				{user && user?.username === undefined && (
					<UserNameModal>precisa setar nome</UserNameModal>
				)}
				<ErrorBoundary>
					<Suspense fallback={<LoadingPageComponent />}>
						<Routes>
							<Route path="/" element={<Home />}></Route>
							<Route path="/signup" element={<SignupPage />}></Route>
							<Route path="/tos" element={<ToSPage />}></Route>
							<Route path="/privacy" element={<PrivacyPage />}></Route>
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
							<Route path="/series/:id/*" element={<SeriesPage />}></Route>
							<Route path="/volume/:id/*" element={<VolumePage />}></Route>
							<Route path="/user/:username/*" element={<UserPage />}></Route>
							<Route
								path="/settings"
								element={
									<RequireAuth>
										<SettingsPage />
									</RequireAuth>
								}
							></Route>
							<Route
								path="/notifications"
								element={
									<RequireAuth>
										<NotificationsPage />
									</RequireAuth>
								}
							></Route>
							<Route path="/adult-block" element={<AdultPageRedirect />}></Route>
							<Route
								path="/submissions/series/:id"
								element={
									<RequireAuth>
										<SeriesSubmissionPage />
									</RequireAuth>
								}
							></Route>
							<Route
								path="/submissions/volume/:id"
								element={
									<RequireAuth>
										<VolumeSubmissionPage />
									</RequireAuth>
								}
							></Route>
							<Route
								path="/dashboard"
								element={
									<RequireAuth adminOnly>
										<AdminDashboard />
									</RequireAuth>
								}
							></Route>
							<Route path="/post/:postId" element={<CommentThreadPage />}></Route>

							<Route path="*" element={<NotFound />}></Route>
						</Routes>
					</Suspense>
				</ErrorBoundary>

				<footer className="footer">
					{user ? (
						<Link to="/logout">Sair</Link>
					) : (
						<Link to="/login">Logar</Link>
					)}
					<Link to="/about">Sobre nós</Link>
					<Link to="/donate">Apoie o projeto</Link>
					<Link to="/tos">Termos de Serviço</Link>
					<Link to="/privacy">Privacidade</Link>
				</footer>
				<MessageComponent></MessageComponent>
			</BrowserRouter>
		</div>
	);
}

export default App;
