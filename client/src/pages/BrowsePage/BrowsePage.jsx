import React, {
	useState,
	useCallback,
	useMemo,
} from "react";
import axios from "axios";
import "./BrowsePage.css";
import debaunce from "../../utils/debaunce";

import {
	Link,
	useSearchParams,
} from "react-router-dom";
import SeriesCardList from "../../components/SeriesCardList";
import TogglePageButton from "../../components/TogglePageButton";

const SKELETON_LOADING_COUNT = 12;

const genreList = [
	"Aventura",
	"Ação",
	"Comédia",
	"Drama",
	"Ecchi",
	"Esportes",
	"Fantasia",
	"Ficção Científica",
	"Garotas mágicas",
	"Hentai",
	"Mecha (Robôs gigantes)",
	"Mistério",
	"Música",
	"Psicológico",
	"Romance",
	"Slice of Life",
	"Sobrenatural",
	"Suspense",
	"Terror",
];
const publishersList = [
	"Abril",
	"Alta Geek",
	"Alto Astral",
	"Comix Zone",
	"Conrad",
	"Conrad / JBC",
	"Darkside Books",
	"Dealer",
	"Devir",
	"Escala",
	"Excelsior",
	"Galera Record",
	"HQM",
	"JBC",
	"L&PM",
	"MPEG",
	"Morro Branco",
	"Mythos",
	"NewPOP",
	"Nova Sampa",
	"Novatec",
	"Online",
	"PNC",
	"Panini",
	"Pipoca & Nanquim",
	"Savana",
	"Skript",
	"Todavia",
	"Veneta",
	"Zarabatana Books",
];

export default function BrowsePage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const urlSearch = searchParams.get("search-bar");
	const urlGenre = searchParams.get("genre");
	const urlPublisher = searchParams.get("publisher");
	const urlOrder = searchParams.get("ordering");
	const initialParams = {
		...(urlSearch && { "search-bar": urlSearch }),
		...(urlGenre && { genre: urlGenre }),
		...(urlPublisher && { publisher: urlPublisher }),
		...(urlOrder && { ordering: urlOrder }),
	};

	const [searchBarValue, setSearchBarValue] = useState(urlSearch);
	const [params, setParams] = useState(initialParams);
	const functionArguments = useMemo(() => [params], [params]);

	const fetchPage = async (page, params) => {
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
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/data/browse`,
			});
			const resultList = response.data;
			return resultList;
		} catch (error) {
			console.error("Error fetching series list:", error);
		}
	};

	const ErrorComponent = () => {
		return (
			<p className="not-found-message">
				Não encontramos nada para "{params["search-bar"]}" verifique se você
				digitou corretamente ou então{" "}
				<Link to={"/feedback"}>
					<strong>sugira sua obra para nós</strong>
				</Link>{" "}
				para que poçamos adiciona-la no futuro
			</p>
		);
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		if (name === "search-bar") {
			setSearchBarValue(value);
		}
		if (value.trim() !== "" || value === null) {
			debouncedSearch(name, value);
		} else {
			setParams({ ...params, [name]: value });
			const { [name]: removed, ...copy } = params;
			setSearchParams({ ...copy });
		}
	};

	const debouncedSearch = useCallback(
		debaunce((name, value) => {
			setParams({ ...params, [name]: value });
			setSearchParams({ ...params, [name]: value });
		}, 500),
		[params]
	);
	const handleSubmit = (e) => {
		e.preventDefault();
		setParams(searchBarValue);
	};
	return (
		<div className="browse-collection-page container page-content">
			<TogglePageButton></TogglePageButton>
			<form className="filter" onSubmit={handleSubmit}>
				<div className="filter__search">
					<label htmlFor="search-bar" className="filter__label">
						Buscar
						<input
							type="text"
							name="search-bar"
							id="search-bar"
							autoComplete="off"
							placeholder="Buscar"
							className="form__input filter__input filter__input--grow "
							onChange={handleChange}
						/>
					</label>
				</div>

				<div className="filter__types">
					<label htmlFor="genre" className="filter__label">
						Gêneros
						<select
							name="genre"
							id="genre"
							className="form__input filter__input"
							onChange={handleChange}
							defaultValue={""}
						>
							<option value={""}>Selecionar</option>
							{genreList.map((genre, id) => {
								return (
									<option value={genre} key={id}>
										{genre}
									</option>
								);
							})}
						</select>
					</label>
					<label htmlFor="publisher" className="filter__label">
						Editora
						<select
							name="publisher"
							id="publisher"
							className="form__input filter__input"
							onChange={handleChange}
							defaultValue={""}
						>
							<option value="">Selecionar</option>
							{publishersList.map((publisher, id) => {
								return (
									<option value={publisher} key={id}>
										{publisher}
									</option>
								);
							})}
						</select>
					</label>
					<label htmlFor="ordering" className="filter__label">
						Ordem
						<select
							name="ordering"
							id="ordering"
							className="form__input filter__input"
							onChange={handleChange}
						>
							<option value={"title"}>Alfabética</option>
							{/* <option value={"date"}>Data</option> */}
							<option value={"volumes"}>Tamanho</option>
							<option value={"publisher"}>Editora</option>
						</select>
					</label>
				</div>
			</form>
			<SeriesCardList
				skeletonsCount={12}
				fetchFunction={fetchPage}
				functionArguments={functionArguments}
				errorComponent={ErrorComponent}
			></SeriesCardList>
		</div>
	);
}
