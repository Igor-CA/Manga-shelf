import axios from "axios";
import { useContext } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../SeriesPage/SeriesPage.css";
import SeriesCardList from "../../components/cards/SeriesCardList";
import AffiliateDisclosure from "../../components/links/AffiliateDisclosure";
import FilterControls from "../../components/FilterControls";
import { useFilterHandler } from "../../utils/useFiltersHandler";
import { UserContext } from "../../contexts/userProvider";
export default function MissingVolumesPage() {
	const { username } = useParams();
	const navigate = useNavigate();
	const { user: loggedUser } = useContext(UserContext);
	const isOwner = username === loggedUser?.username;
	const personalRatingLabel =
		username === loggedUser?.username ? "Sua nota" : `Nota de ${username}`;

	const fetchFiltersUrl = `${
		import.meta.env.REACT_APP_HOST_ORIGIN
	}/api/data/user/${username}/filters`;
	const {
		params,
		functionArguments,
		genreList,
		publishersList,
		typesList,
		demographicsList,
		handleChange,
		searchBarValue,
	} = useFilterHandler(fetchFiltersUrl, true, { source: "missing" }, "title");

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
				}/api/data/user/${username}/missing`,
			});
			const responseData = response.data;
			return responseData;
		} catch (error) {
			const errorType = error.response?.status;
			if (errorType === 400) {
				navigate("/404");
			}
			console.error(
				"Error fetching Missing volumes data:",
				error.response?.data?.msg
			);
		}
	};

	const EmptyListComponent = () => {
		return (
			<p className="not-found-message">
				Esta conta não possuí nenhum volume faltando. Talvez seja a hora de
				começar uma nova coleção?
				<Link to={"/browse"}>
					<strong>Busque novos títulos na nossa página de pesquisa</strong>
				</Link>{" "}
			</p>
		);
	};

	return (
		<div className="container">
			{isOwner && <AffiliateDisclosure />}
			<FilterControls
				availableFilters={[
					"search",
					"genre",
					"publisher",
					"status",
					"demographic",
					"type",
					"ordering",
					"ordering_missing",
				]}
				handleChange={handleChange}
				values={{ searchBarValue, ...params }}
				lists={{ genreList, publishersList, typesList, demographicsList }}
				personalRatingLabel={personalRatingLabel}
			/>
			<SeriesCardList
				skeletonsCount={36}
				fetchFunction={fetchMissingVolumes}
				itemType="Volumes"
				errorComponent={EmptyListComponent}
				functionArguments={functionArguments}
				showActions={true}
			></SeriesCardList>
		</div>
	);
}
