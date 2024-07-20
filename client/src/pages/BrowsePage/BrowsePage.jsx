import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import "./BrowsePage.css";
import debaunce from "../../utils/debaunce";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { Link, useSearchParams } from "react-router-dom";
import SeriesCardList from "../../components/SeriesCardList";

const SKELETON_LOADING_COUNT = 12

export default function BrowsePage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const initialSearch = searchParams.get("q") || "";
	const [page, setPage] = useState(1);
	const [searchBarValue, setSearchBarValue] = useState(initialSearch);
	const [query, setQuery] = useState(initialSearch);
	const [loading, setLoading] = useState(false);
	const [seriesList, setSeriesList] = useState([]);
	const [reachedEnd, setReachedEnd] = useState(false);
	const [isEmptyList, setIsEmptyList] = useState(false);

	const fetchPage = async (page, query) => {
		try {
			const response = await axios({
				method: "GET",
				withCredentials: true,
				headers: {
					Authorization: process.env.REACT_APP_API_KEY,
				},
				params: {
					p: page,
					q: query,
				},
				url: "/api/data/browse",
			});
			const resultList = response.data;
			return resultList;
		} catch (error) {
			console.error("Error fetching series list:", error);
		}
	};

	const observer = useRef();

	const lastSeriesElementRef = useCallback((node) => {
		if (observer.current) observer.current.disconnect();
		observer.current = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting) {
				setPage((prevPage) => prevPage + 1);
			}
		});
		if (node) observer.current.observe(node);
	}, []);

	const updatePage = async (targetPage, targetQuery) => {
		if (!loading && !reachedEnd) {
			setLoading(true);
			try {
				const resultList = await fetchPage(targetPage, targetQuery);
				if (resultList.length > 0) {
					setSeriesList((previousList) =>
						targetPage === 1
							? [...resultList]
							: [...previousList, ...resultList]
					);
					setIsEmptyList(false);
				} else {
					if (page === 1) {
						setSeriesList([]);
						setIsEmptyList(true);
					}
					setReachedEnd(true);
				}
			} catch (error) {
				console.error("Error fetching user Data:", error);
			} finally {
				setLoading(false);
			}
		}
	};

	const handleChange = (e) => {
		const inputValue = e.target.value;
		setSearchBarValue(inputValue);
		setSearchParams({ q: inputValue });
		if (inputValue.trim() !== "") {
			debouncedSearch(inputValue);
		} else {
			setReachedEnd(false);
			setPage(1);
			setQuery(null);
		}
	};

	const debouncedSearch = useCallback(
		debaunce((value) => {
			console.log("value:", value);
			setReachedEnd(false);
			setPage(1); // Reset page number on new search
			setSeriesList([])
			setQuery(value);
		}, 500),
		[]
	);

	const handleSubmit = (e) => {
		e.preventDefault();
	};

	useEffect(() => {
		updatePage(page, query);
	}, [page, query]);

	return (
		<div className="browse-collection-page container page-content">
			<form className="form" onSubmit={(e) => handleSubmit(e)}>
				<label htmlFor="search-bar" className="form__label">
					Pesquisa
				</label>
				<input
					type="search"
					name="search-bar"
					className="form__input form__input__grow"
					placeholder="Buscar "
					onChange={(e) => {
						handleChange(e);
					}}
					value={searchBarValue}
				/>
				<button type="submit" className="form__input">
					<FontAwesomeIcon icon={faMagnifyingGlass} size="xl" fixedWidth />
				</button>
			</form>

			{isEmptyList && (
				<p className="not-found-message">
					Não encontramos nada para "{query}" verifique se você digitou
					corretamente ou então{" "}
					<Link to={"/feedback"}>
						<strong>sugira sua obra para nós</strong>
					</Link>{" "}
					para que poçamos adiciona-la no futuro
				</p>
			)}
			<SeriesCardList
				list={seriesList}
				lastSeriesElementRef={lastSeriesElementRef}
				skeletonsCount={loading?SKELETON_LOADING_COUNT:0}
			></SeriesCardList>
		</div>
	);
}
