import React, { useState, useCallback, useMemo } from "react";
import axios from "axios";
import "./BrowsePage.css";
import debaunce from "../../utils/debaunce";

import { Link, useSearchParams } from "react-router-dom";
import SeriesCardList from "../../components/SeriesCardList";
import TogglePageButton from "../../components/TogglePageButton";
import { useContext } from "react";
import { messageContext } from "../../components/messageStateProvider";
import { useEffect } from "react";

export default function BrowsePage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const urlSearch = searchParams.get("search-bar");
	const urlGenre = searchParams.get("genre");
	const urlPublisher = searchParams.get("publisher");
	const urlOrder = searchParams.get("ordering");
	const urlStatus = searchParams.get("status");
	const initialParams = {
		...(urlSearch && { "search-bar": urlSearch }),
		...(urlGenre && { genre: urlGenre }),
		...(urlPublisher && { publisher: urlPublisher }),
		...(urlOrder && { ordering: urlOrder }),
		...(urlStatus && { status: urlStatus }),
	};

	const [searchBarValue, setSearchBarValue] = useState(urlSearch || "");
	const [params, setParams] = useState(initialParams);
	const functionArguments = useMemo(() => [params], [params]);

	const [genreList, setGenresList] = useState([]);
	const [publishersList, setPublishersList] = useState([]);
	const { addMessage } = useContext(messageContext);

	useEffect(() => {
		const fetchFiltersInfo = async () => {
			try {
				const res = await axios({
					method: "GET",
					withCredentials: true,
					headers: {
						Authorization: import.meta.env.REACT_APP_API_KEY,
					},
					url: `${
						import.meta.env.REACT_APP_HOST_ORIGIN
					}/api/data/series/filters`,
				});
				const result = res.data;
				setGenresList(result.genres);
				setPublishersList(result.publishers);
			} catch (error) {
				const customErrorMessage = err.response.data.msg;
				addMessage(customErrorMessage);
			}
		};
		fetchFiltersInfo();
	}, []);

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
				digitou corretamente. <br />
				<br />
				<strong>Importante</strong>: Algumas obras podem ser classificadas como
				conteúdo adulto. Se você não ativou essa opção nas suas configurações,
				elas não aparecerão nos resultados.{" "}
				<Link to={"/settings"}>Clique aqui</Link> para verificar ou alterar suas
				permissões. <br />
				Caso a obra realmente não esteja disponível, você pode{" "}
				<Link to={"/feedback"}>sugeri-la aqui</Link> para que possamos
				adicioná-la futuramente!
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
							value={searchBarValue}
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
							<option value={"popularity"}>Popularidade</option>
							<option value={"title"}>Alfabética</option>
							{/* <option value={"date"}>Data</option> */}
							<option value={"volumes"}>Tamanho</option>
							<option value={"publisher"}>Editora</option>
						</select>
					</label>
					<label htmlFor="status" className="filter__label">
						Situação
						<select
							name="status"
							id="status"
							className="form__input filter__input"
							onChange={handleChange}
							defaultValue={""}
						>
							<option value="">Selecionar</option>
							<option value={"Finalizado"}>Finalizado</option>
							<option value={"Em andamento"}>Em andamento</option>
							<option value={"Em publicação"}>Em publicação no Brasil</option>
							<option value={"Hiatus"}>Hiatus</option>
							<option value={"Cancelado"}>Cancelado</option>
						</select>
					</label>
				</div>
			</form>
			<SeriesCardList
				skeletonsCount={12}
				fetchFunction={fetchPage}
				functionArguments={functionArguments}
				errorComponent={ErrorComponent}
				showActions={true}
			></SeriesCardList>
		</div>
	);
}
