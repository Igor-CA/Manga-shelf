import { Link, useNavigate, useParams } from "react-router-dom";
import SeriesCardList from "../../components/cards/SeriesCardList";
import axios from "axios";
import { useCallback, useContext } from "react";
import debaunce from "../../utils/debaunce";
import { useFilterHandler } from "../../utils/useFiltersHandler";
import FilterControls from "../../components/FilterControls";
import { UserContext } from "../../contexts/userProvider";
import { hasActiveFilters } from "../../utils/hasActiveFilters";
import { readStorage, writeStorage } from "../../utils/storage";

const COLLECTION_VIEW_KEY = "view:collection";
const COLLECTION_GROUP_KEY = "groupBy:collection";

const readStoredCollectionParams = () => {
	const stored = {};
	const view = readStorage(COLLECTION_VIEW_KEY);
	if (view) stored.view = view;
	const groupBy = readStorage(COLLECTION_GROUP_KEY);
	if (groupBy) stored.groupBy = groupBy;
	return stored;
};

export default function UserCollection() {
	const { username } = useParams();
	const navigate = useNavigate();
	const { user: loggedUser } = useContext(UserContext);
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
	} = useFilterHandler(
		fetchFiltersUrl,
		true,
		{},
		"title",
		readStoredCollectionParams()
	);
	const isGrouped = params.groupBy === "status";
	const isVolumeView = params.view === "volumes";
	const statuses = ["Collecting", "Up to date", "Finished", "Dropped"];
	const statusesLables = [
		"Incompleto",
		"Acompanhando publicação",
		"Concluído",
		"Abandonado",
	];

	const handleGroupChange = (e) => {
		writeStorage(COLLECTION_GROUP_KEY, e.target.checked ? "status" : "");
		handleChange(e);
	};

	const handleViewChange = (e) => {
		writeStorage(COLLECTION_VIEW_KEY, e.target.checked ? "volumes" : "");
		handleChange(e);
	};

	const querryUserList = async (page, params) => {
		try {
			const res = await axios({
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
				}/api/data/user/${username}`,
			});
			const result = res.data;
			return result;
		} catch (error) {
			const errorType = error.response?.status;
			if (errorType === 400) {
				navigate("/404");
			}
		}
	};

	const filtersActive = hasActiveFilters(params, searchBarValue);

	const EmptyListComponent = () => {
		if (filtersActive) {
			return (
				<p className="not-found-message">
					{isVolumeView
						? "Nenhum volume corresponde aos filtros selecionados."
						: "Nenhuma obra corresponde aos filtros selecionados."}
				</p>
			);
		}
		return (
			<p className="not-found-message">
				Esta conta não possuí nenhuma coleção registrada. Caso essa seja sua
				conta tente{" "}
				<Link to={"/browse"}>
					<strong>
						adicionar suas coleções buscando em nossa página de busca
					</strong>
				</Link>{" "}
			</p>
		);
	};
	return (
		<div className="user-collection container">
			<FilterControls
				availableFilters={[
					"search",
					"genre",
					"publisher",
					"status",
					"demographic",
					"type",
					"ordering",
					"ordering_percentage"
				]}
				handleChange={handleChange}
				values={{ searchBarValue, ...params }}
				lists={{ genreList, publishersList, typesList, demographicsList }}
				personalRatingLabel={personalRatingLabel}
			>
				<div className="filter__label">
					Exibição
					<div className="form__input filter__input filter__options">
						<label
							htmlFor="groupBy"
							className="filter__option"
							title="Agrupar por status da coleção"
						>
							Por status
							<input
								type="checkbox"
								name="groupBy"
								id="groupBy"
								value="status"
								className="filter__checkbox"
								onChange={handleGroupChange}
								checked={isGrouped}
							/>
						</label>
						<label
							htmlFor="view"
							className="filter__option"
							title="Exibir por volume"
						>
							Por volume
							<input
								type="checkbox"
								name="view"
								id="view"
								value="volumes"
								className="filter__checkbox"
								onChange={handleViewChange}
								checked={isVolumeView}
							/>
						</label>
					</div>
				</div>
			</FilterControls>
			{isGrouped ? (
				statuses.map((status, i) => {
					return (
						<div>
							<hr style={{ margin: "0px 10px" }} />
							<h2 className="collection-lable">{statusesLables[i]}</h2>
							<SeriesCardList
								skeletonsCount={36}
								fetchFunction={querryUserList}
								errorComponent={EmptyListComponent}
								functionArguments={[{ ...params, group: status }]}
								itemType={isVolumeView ? "Volumes" : "Series"}
							></SeriesCardList>
						</div>
					);
				})
			) : (
				<SeriesCardList
					skeletonsCount={36}
					fetchFunction={querryUserList}
					errorComponent={EmptyListComponent}
					functionArguments={functionArguments}
					itemType={isVolumeView ? "Volumes" : "Series"}
				></SeriesCardList>
			)}
		</div>
	);
}
