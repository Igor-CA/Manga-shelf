import React, {
	useState,
	useEffect,
	useCallback,
	useRef,
	useMemo,
} from "react";
import axios from "axios";
import "./BrowsePage.css";
import debaunce from "../../utils/debaunce";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { Link, useSearchParams } from "react-router-dom";
import SeriesCardList from "../../components/SeriesCardList";

const SKELETON_LOADING_COUNT = 12;

export default function BrowsePage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const initialSearch = searchParams.get("q") || "";
	const [searchBarValue, setSearchBarValue] = useState(initialSearch);
	const [query, setQuery] = useState(initialSearch);
	const functionArguments = useMemo(() => [query], [query]);

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

	const ErrorComponent = () => {
		return (
			<p className="not-found-message">
				Não encontramos nada para "{query}" verifique se você digitou
				corretamente ou então{" "}
				<Link to={"/feedback"}>
					<strong>sugira sua obra para nós</strong>
				</Link>{" "}
				para que poçamos adiciona-la no futuro
			</p>
		);
	};

	const handleChange = (e) => {
		const inputValue = e.target.value;
		setSearchBarValue(inputValue);
		setSearchParams({ q: inputValue });
		if (inputValue.trim() !== "") {
			debouncedSearch(inputValue);
		} else {
			setQuery("");
		}
	};

	const debouncedSearch = useCallback(
		debaunce((value) => {
			setQuery(value);
		}, 500),
		[]
	);
	const handleSubmit = (e) => {
		e.preventDefault();
		setQuery(searchBarValue)
	};

	return (
		<div className="browse-collection-page container page-content">
			<form className="form" onSubmit={handleSubmit} >
				<input
					type="search"
					name="search-bar"
					id="search-bar"
					className="form__input form__input__grow"
					placeholder="Buscar "
					onChange={handleChange}
					value={searchBarValue}
				/>
					<label htmlFor="search-bar" className="form__input">
							<FontAwesomeIcon icon={faMagnifyingGlass} size="xl" fixedWidth />
					</label>
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
