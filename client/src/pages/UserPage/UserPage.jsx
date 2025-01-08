import { Route, Routes, useParams } from "react-router-dom";
import "./UserPage.css";
import { lazy } from "react";

const UserCollection = lazy(() => import("./UserCollection"));
const ProfileHeader = lazy(() => import("./ProfileHeader"));
const MissingVolumesPage = lazy(() => import("./MissingVolumesPage"));
const UserStatsPage = lazy(() => import("./UserStatsPage"));

export default function UserPage() {
	const { username } = useParams();

	return (
		<>
			<div className="page-content" key={username}>
				<ProfileHeader user={username}></ProfileHeader>
				<Routes>
					<Route path="missing" element={<MissingVolumesPage />}></Route>
					<Route path="stats" element={<UserStatsPage />}></Route>
					<Route path="" element={<UserCollection />}></Route>
				</Routes>
			</div>
		</>
	);
}
