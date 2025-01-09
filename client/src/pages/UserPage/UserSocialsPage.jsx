import axios from "axios";
import UserCardsList from "../../components/UserCardsList";
import { useParams } from "react-router-dom";
import { useState } from "react";

import "../SeriesPage/SeriesPage.css";
export default function UserSocials() {
	const { username } = useParams();

	const [page, setPage] = useState("Seguidores");

	const handleToggle = () => {
		setPage((prev) => {
			return prev === "Seguindo" ? "Seguidores" : "Seguindo";
		});
	};

	const fetchFollowers = async () => {
		try {
			const response = await axios({
				method: "GET",
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				url: `${
					import.meta.env.REACT_APP_HOST_ORIGIN
				}/api/data/get-user-socials/followers/${username}`,
			});
			const resultList = response.data;
			console.log(resultList);
			return resultList;
		} catch (error) {
			console.error("Error fetching series list:", error);
		}
	};
	const fetchFollowing = async () => {
		try {
			const response = await axios({
				method: "GET",
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				url: `${
					import.meta.env.REACT_APP_HOST_ORIGIN
				}/api/data/get-user-socials/following/${username}`,
			});
			const resultList = response.data;
			console.log(resultList);
			return resultList;
		} catch (error) {
			console.error("Error fetching series list:", error);
		}
	};

	const ErrorComponentFollower = () => {
		return (
			<p className="not-found-message">
				Esse usuário não possui nenhum seguidor
			</p>
		);
	};
	const ErrorComponentFollowing = () => {
		return <p className="not-found-message">Esse usuário não segue ninguém</p>;
	};
	return (
		<div className="container page-info">
			<div className="options-container">
				<div
					className={`options options--${
						page === "Seguidores" && "selected"
					}`}
					onClick={handleToggle}
				>
					Seguidores
				</div>
				<div
					className={`options options--${
						page === "Seguindo" && "selected"
					}`}
					onClick={handleToggle}
				>
					Seguindo
				</div>
			</div>
			<UserCardsList
				skeletonsCount={12}
				fetchFunction={page === "Seguindo" ? fetchFollowing : fetchFollowers}
				errorComponent={
					page === "Seguindo" ? ErrorComponentFollowing : ErrorComponentFollower
				}
				functionArguments={page}
			></UserCardsList>
		</div>
	);
}
