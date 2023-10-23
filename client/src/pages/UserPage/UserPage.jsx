import { useState, useEffect } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import UserCollection from "./UserCollection";
import "./UserPage.css";
import axios from "axios";
import ProfileHeader from "./ProfileHeader";
import MissingVolumesPage from "./MissingVolumesPage";

export default function UserPage() {
	const { username } = useParams();
	const [user, setUser] = useState();
	const [missingList, setMissingList] = useState([]);
	const navigate = useNavigate();
	useEffect(() => {
		const querryUser = async () => {
			try {
				const res = await axios({
					method: "GET",
					withCredentials: true,
					headers: {
						Authorization:process.env.REACT_APP_API_KEY,
					},
					url: `/api/data/user/${username}`,
				});
				setUser(res.data);
			} catch (error) {
				const errorType = error.response.status;
				if (errorType === 400) {
					navigate("/404");
				}
			}
		};

		const fetchMissingVolumes = async () => {
			try {
				const response = await axios({
					method: "GET",
					withCredentials: true,
					headers: {
						Authorization:process.env.REACT_APP_API_KEY,
					},
					url: `/api/data/user/${username}/missing`,
				});
				const responseData = response.data;
				setMissingList(responseData);
			} catch (error) {
				const errorType = error.response.status;
				if (errorType === 400) {
					navigate("/404");
				}
				console.error(
					"Error fetching Missing volumes data:",
					error.response.data.msg
				);
			}
		};
		fetchMissingVolumes();
		querryUser();
	}, []);

	//TODO change to loading page login redirect not needed anymore

	return (
		<>
			{user && (
				<div className="page-content">
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
	);
}
