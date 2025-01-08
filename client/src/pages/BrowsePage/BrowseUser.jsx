import { useSearchParams } from "react-router-dom";
import "./BrowsePage.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import debaunce from "../../utils/debaunce";
import axios from "axios";
import UserCard from "../../components/UserCard";


export default function BrowseUser() {
	const [searchParams, setSearchParams] = useSearchParams();
	const initialSearch = searchParams.get("q") || "";

	const [searchBarValue, setSearchBarValue] = useState(initialSearch);
	const [query, setQuery] = useState(initialSearch);

	const [searchResults, setSearchResults] = useState([]);

	useEffect(() => {
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
						q: query,
					},
					url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/data/search-user`,
				});
				const resultList = response.data;
				setSearchResults(resultList);
			} catch (error) {
				console.error("Error fetching series list:", error);
			}
		};
		fetchPage(1, query);
	}, [query]);

	const ErrorComponent = () => {
		return (
			<p className="not-found-message">
				Não foi possível encontrar o usuário "{query}" verifique se você digitou
				corretamente
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
		setQuery(searchBarValue);
	};

	return (
		<div className="browse-collection-page container page-content">
			
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
			</form>
			{searchResults.length > 0 ? (
				<div className="users-container">
					{searchResults.map((user) => (
						<UserCard user={user}></UserCard>
					))}
				</div>
			) : (
				ErrorComponent()
			)}
		</div>
	);
}
