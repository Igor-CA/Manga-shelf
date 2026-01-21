import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "../SeriesPage/SeriesPage.css";
import SeriesCardList from "../../components/cards/SeriesCardList";
import { useCallback, useMemo, useState } from "react";
import debaunce from "../../utils/debaunce";
import { useEffect } from "react";
import { useContext } from "react";
import { messageContext } from "../../contexts/messageStateProvider";
import FilterControls from "../../components/FilterControls";
import { useFilterHandler } from "../../utils/useFiltersHandler";

export default function WishlistPage() {
	const { username } = useParams();
	const navigate = useNavigate();

	const fetchFiltersUrl = `${
		import.meta.env.REACT_APP_HOST_ORIGIN
	}/api/data/user/${username}/filters`;
	const {
		params,
		functionArguments,
		genreList,
		publishersList,
		handleChange,
		searchBarValue,
	} = useFilterHandler(fetchFiltersUrl, true, { source: "wishList" }, "title");

	const { addMessage } = useContext(messageContext);

	const fetchMissingVolumes = async (page) => {
		try {
			const response = await axios({
				method: "GET",
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				params: {
					p: page,
					...params,
				},
				url: `${
					import.meta.env.REACT_APP_HOST_ORIGIN
				}/api/data/user/${username}/wishlist`,
			});
			const responseData = response.data;
			return responseData;
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

	const EmptyListComponent = () => {
		return (
			<p className="not-found-message">
				Esta conta não possuí nada na lista de desejos.
			</p>
		);
	};

	return (
		<div className="container">
			<FilterControls
				availableFilters={["search", "genre", "publisher", "status", "ordering"]}
				handleChange={handleChange}
				values={{ searchBarValue, ...params }}
				lists={{ genreList, publishersList }}
			/>{" "}
			<SeriesCardList
				skeletonsCount={36}
				fetchFunction={fetchMissingVolumes}
				itemType="Series"
				errorComponent={EmptyListComponent}
				functionArguments={functionArguments}
				showActions={true}
			></SeriesCardList>
		</div>
	);
}
