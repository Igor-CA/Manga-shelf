import { useContext, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { UserContext } from "../../components/userProvider";
import UserCollection from "../../components/UserCollection";
import "./UserPage.css";
import axios from "axios";
import BrowsePage from "../BrowsePage/BrowsePage";

export default function UserPage() {
	const { username } = useParams();
	const [user, setUser] = useState();
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
		<div>
			{user ? (
				<UserCollection user={user}></UserCollection>
			) : (
				renderLoginRedirect()
			)}
		</div>
		//Header -> Profile info
		//body
		//Collection
		//Search
		//Missing volumes
		//Footer / navbar
	);
}
