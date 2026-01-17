import { Link, useNavigate, useParams } from "react-router-dom";
import SeriesCardList from "../../components/cards/SeriesCardList";
import axios from "axios";
import { useCallback, useState } from "react";
import debaunce from "../../utils/debaunce";
import { useFilterHandler } from "../../utils/useFiltersHandler";
import FilterControls from "../../components/FilterControls";

export default function UserCollection() {
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
	} = useFilterHandler(fetchFiltersUrl, true, {}, "title");
	const [groupVal, setGroupVal] = useState(false);
	const statuses = ["Collecting", "Up to date", "Finished", "Dropped"];
	const statusesLables = [
		"Incompleto",
		"Acompanhando publicação",
		"Concluído",
		"Abandonado",
	];
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
			const errorType = error.response.status;
			if (errorType === 400) {
				navigate("/404");
			}
		}
	};

	const EmptyListComponent = () => {
		return (
			<p className="not-found-message">
				Esta conta não possuí nenhuma coleção registrada ou com esses filtros.
				Caso essa seja sua conta tente{" "}
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
					"ordering",
					"ordering_percentage"
				]}
				handleChange={handleChange}
				values={{ searchBarValue, ...params }}
				lists={{ genreList, publishersList }}
			>
				<div className="filter__checkbox-container">
					<label htmlFor="group" className="filter__label">
						Agrupar por status da coleção
						<input
							type="checkbox"
							name="group"
							id="group"
							className="filter__checkbox"
							onChange={(e) => setGroupVal(e.target.checked)}
							checked={groupVal}
						/>
					</label>
				</div>
			</FilterControls>
			{groupVal ? (
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
				></SeriesCardList>
			)}
		</div>
	);
}
