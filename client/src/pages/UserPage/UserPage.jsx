import { Route, Routes, useParams } from "react-router-dom";
import UserCollection from "./UserCollection";
import "./UserPage.css";
import ProfileHeader from "./ProfileHeader";
import MissingVolumesPage from "./MissingVolumesPage";
import UserStatsPage from "./UserStatsPage";

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
