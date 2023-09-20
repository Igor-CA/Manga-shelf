import { useState, useEffect } from "react";
import { Link, Route, Routes, useParams } from "react-router-dom";
import UserCollection from "./UserCollection";
import "./UserPage.css";
import axios from "axios";
import ProfileHeader from "./ProfileHeader";
import MissingVolumesPage from "./MissingVolumesPage";

export default function UserPage() {
	const { username } = useParams();
	const [user, setUser] = useState();
	const [missingList, setMissingList] = useState([]);
	useEffect(() => {
		const querryUser = async () => {
			try {
				const res = await axios({
					method: "GET",
					withCredentials: true,
					url: `${process.env.REACT_APP_HOST_ORIGIN}/api/user/${username}`,
				});
				console.log(res.data);
				setUser(res.data);
			} catch (error) {
				console.log(error);
			}
		};

		const fetchMissingVolumes = async () => {
			try {
				const response = await axios({
					method: "GET",
					withCredentials: true,
					url: `${process.env.REACT_APP_HOST_ORIGIN}/api/user/${username}/missing`,
				});
				console.log(response.data);
				const responseData = response.data;
				setMissingList(responseData);
			} catch (error) {
				console.error("Error fetching Series Data:", error);
			}
		};
		fetchMissingVolumes();
		querryUser();
	}, []);

	//TODO change to loading page login redirect not needed anymore
	const renderLoginRedirect = () => {
		return (
			<div className="redirect-page">
				<h1>User not connected</h1>
				<h2>Please login or Signup</h2>
				<Link to={"/login"}>Login</Link>
				<Link to={"/signup"}>Signup</Link>
			</div>
		);
	};

	return (
		<>
			{user && (
				<div>
					<ProfileHeader user={user}></ProfileHeader>
					<Routes>
						<Route
							path="missing"
							element={<MissingVolumesPage missingList={missingList} />}
						></Route>
						<Route path="" element={<UserCollection user={user} />}></Route>
					</Routes>
				</div>
			)}
		</>
		//Header -> Profile info
		//body
		//Collection
		//Search
		//Missing volumes
		//Footer / navbar
	);
}
