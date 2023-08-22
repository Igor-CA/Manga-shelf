import { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../../components/userProvider";
import UserCollection from "../../components/UserCollection";
import "./UserPage.css";
import axios from "axios";
import BrowsePage from "../BrowsePage/BrowsePage";

export default function UserPage() {
	const [currentPage, setCurrentPage] = useState("Collection");
	const [user, setUser] = useContext(UserContext);

	useEffect(() => {
		const querryUser = async () => {
			const res = await axios({
				method: "GET",
				withCredentials: true,
				url: `${process.env.REACT_APP_HOST_ORIGIN}/user/profile`,
			});
			console.log(res.data);
			setUser(res.data);
		};
		querryUser();
	}, []);

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
			{user ? <UserCollection></UserCollection> : renderLoginRedirect()}
		</div>
		//Header -> Profile info
		//body
		//Collection
		//Search
		//Missing volumes
		//Footer / navbar
	);
}
