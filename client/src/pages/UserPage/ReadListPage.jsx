import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../SeriesPage/SeriesPage.css";
import SeriesCardList from "../../components/cards/SeriesCardList";
import FilterControls from "../../components/FilterControls";
import { useFilterHandler } from "../../utils/useFiltersHandler";
import { useCallback } from "react";
import { useMemo } from "react";
export default function ReadListPage() {
	const { username } = useParams();
	const navigate = useNavigate();

	const fetchFiltersUrl = `${
		import.meta.env.REACT_APP_HOST_ORIGIN
	}/api/data/user/${username}/filters`;
	const { params, genreList, publishersList, handleChange, searchBarValue } =
		useFilterHandler(fetchFiltersUrl, true, {}, "title");
	const fetchVolumes = useCallback(
		async (page, params) => {
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
					}/api/data/user/${username}/volumes`,
				});
				return response.data;
			} catch (error) {
				const errorType = error.response?.status; // Added optional chaining safety
				if (errorType === 400) {
					navigate("/404");
				}
				console.error("Error fetching volumes:", error.response?.data?.msg);
			}
		},
		[username, navigate]
	); // Dependencies: recreate only if these change
	const EmptyListComponent = () => {
		return (
			<p className="not-found-message">
				Esta conta não possuí nenhum volume com os filtros aplicados. Talvez
				seja a hora de começar uma nova coleção?
				<Link to={"/browse"}>
					<strong>Busque novos títulos na nossa página de pesquisa</strong>
				</Link>{" "}
			</p>
		);
	};

	const unreadArgs = useMemo(() => [{ ...params, group: false }], [params]);
    const readArgs = useMemo(() => [{ ...params, group: true }], [params]);
	return (
		<div className="container">
			<FilterControls
				availableFilters={[
					"search",
					"genre",
					"publisher",
					"status",
					"ordering",
				]}
				handleChange={handleChange}
				values={{ searchBarValue, ...params }}
				lists={{ genreList, publishersList }}
			></FilterControls>
			<hr style={{ margin: "0px 10px" }} />
			<h2 className="collection-lable">Não lidos</h2>
			<SeriesCardList
				skeletonsCount={36}
				fetchFunction={fetchVolumes}
				itemType="Volumes-Read"
				errorComponent={EmptyListComponent}
				showActions={true}
				functionArguments={unreadArgs}
			></SeriesCardList>

			<hr style={{ margin: "0px 10px" }} />
			<h2 className="collection-lable">Lidos</h2>
			<SeriesCardList
				skeletonsCount={36}
				fetchFunction={fetchVolumes}
				itemType="Volumes-Read"
				errorComponent={EmptyListComponent}
				showActions={true}
				functionArguments={readArgs}
			></SeriesCardList>
		</div>
	);
}
