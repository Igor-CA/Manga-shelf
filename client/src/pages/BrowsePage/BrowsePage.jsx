import React, { useState, useCallback, useMemo } from "react";
import axios from "axios";
import "./BrowsePage.css";
import debaunce from "../../utils/debaunce";

import { Link, useSearchParams } from "react-router-dom";
import SeriesCardList from "../../components/cards/SeriesCardList";
import TogglePageButton from "../../components/TogglePageButton";
import { useContext } from "react";
import { messageContext } from "../../components/messageStateProvider";
import { useEffect } from "react";
import { useFilterHandler } from "../../utils/useFiltersHandler";
import FilterControls from "../../components/FilterControls";

export default function BrowsePage() {
	const fetchFiltersUrl = `${
		import.meta.env.REACT_APP_HOST_ORIGIN
	}/api/data/series/filters`;
	const {
		params,
		functionArguments,
		genreList,
		publishersList,
		typesList,
		originalYearList,
		countryList,
		localYearList,
		handleChange,
		searchBarValue,
	} = useFilterHandler(fetchFiltersUrl, true); // `true` to use URL search params

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

	return (
		<div className="browse-collection-page container page-content">
			<TogglePageButton></TogglePageButton>
			<FilterControls
				availableFilters={[
					"search",
					"genre",
					"publisher",
					"ordering",
					"status",
				]}
				handleChange={handleChange}
				values={{ searchBarValue, ...params }}
				lists={{ genreList, publishersList, typesList, originalYearList, localYearList, countryList }}
				secundaryFilters={true}
			/>
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
