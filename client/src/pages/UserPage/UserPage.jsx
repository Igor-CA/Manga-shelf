import { useState } from "react";
import { Route, Routes, useParams } from "react-router-dom";
import UserCollection from "./UserCollection";
import "./UserPage.css";
import ProfileHeader from "./ProfileHeader";
import MissingVolumesPage from "./MissingVolumesPage";

export default function UserPage() {
	const { username } = useParams();
	const [user, setUser] = useState({ username: username });

	return (
		<>
			<div className="page-content">
				<ProfileHeader user={user}></ProfileHeader>
				<Routes>
					<Route path="missing" element={<MissingVolumesPage />}></Route>
					<Route path="" element={<UserCollection />}></Route>
				</Routes>
			</div>
		</>
	);
}
