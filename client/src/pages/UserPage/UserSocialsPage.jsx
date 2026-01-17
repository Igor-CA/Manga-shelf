import axios from "axios";
import UserCardsList from "../../components/cards/UserCardsList";
import { useParams } from "react-router-dom";
import { useState } from "react";

import "../SeriesPage/SeriesPage.css";
export default function UserSocials() {
	const { username } = useParams();

	const [page, setPage] = useState("followers");

	const handleToggle = () => {
		setPage((prev) => {
			return prev === "following" ? "followers" : "following";
		});
	};

	const fetchSocials = async (pageNumber) => {
		try {
			const response = await axios({
				method: "GET",
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				params: {
					p: pageNumber,
				},
				url: `${
					import.meta.env.REACT_APP_HOST_ORIGIN
				}/api/data/get-user-socials/${page}/${username}`,
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
						page === "followers" && "selected"
					}`}
					onClick={handleToggle}
				>
					Seguidores
				</div>
				<div
					className={`options options--${
						page === "following" && "selected"
					}`}
					onClick={handleToggle}
				>
					Seguindo
				</div>
			</div>
			<UserCardsList
				skeletonsCount={36}
				fetchFunction={fetchSocials}
				errorComponent={
					page === "following" ? ErrorComponentFollowing : ErrorComponentFollower
				}
				functionArguments={page}
			></UserCardsList>
		</div>
	);
}
