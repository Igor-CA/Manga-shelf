import React, { useState, useEffect, useCallback } from "react";
import { SeriesCard } from "../../components/SeriesCard";
import "./BrowsePage.css";
import debaunce from "../../utils/debaunce";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

export default function BrowsePage() {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(false);
	const [seriesList, setSeriesList] = useState([]);
	const [reachedEnd, setReachedEnd] = useState(false);
	const [isEmptyList, setIsEmptyList] = useState(false)

	const fetchSeriesList = async () => {
		try {
			const response = await fetch(
				`${process.env.REACT_APP_HOST_ORIGIN}/admin?p=${page}`
			);
			const resultList = await response.json();
			return resultList;
		} catch (error) {
			console.error("Error fetching series list:", error);
		}
	};
	const updatePage = async () => {
		if (!loading && !reachedEnd) {
			setLoading(true);
			try {
				const resultList = await fetchSeriesList();
				console.log(resultList);
				if (resultList.length > 0) {
					setSeriesList(
						page === 1 ? [...resultList] : [...seriesList, ...resultList]
					);
					setPage(page + 1);
					setIsEmptyList(false)
				} else {
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
		setSearch(inputValue);
		if (inputValue.trim() !== "") {
			debaunceSearch(inputValue);
		} else {
			updatePage();
			setReachedEnd(false);
		}
	};
	const fetchSearch = async (querry) => {
		if (querry.length > 1) {
			setLoading(true);
			try {
				const response = await fetch(
					`${process.env.REACT_APP_HOST_ORIGIN}/api/search?q=${querry}`
				);
				const data = await response.json();
				console.log(querry);
				if (data.length > 0) {
					setSeriesList(data);
					setLoading(false);
					setPage(1);
					setIsEmptyList(false)
					return
				}
				setSeriesList([])
				setIsEmptyList(true)
			} catch (error) {
				console.error("Error fetching user Data:", error);
			} finally {
				setLoading(false);
			}
		}
	};

	const debaunceSearch = useCallback(
		debaunce((search) => {
			fetchSearch(search);
		}, 500),
		[]
	);

	const handleScroll = () => {
		const offset = 250;
		const screeHeigh = window.innerHeight;
		const distanceScrollTop = document.documentElement.scrollTop;
		const appTotalHeight = document.documentElement.offsetHeight;

		if (screeHeigh + distanceScrollTop + offset <= appTotalHeight) 
			return;
		if (loading) 
			return;
		if (search.trim() !== "") 
			return;
		
		
		updatePage();
	};

	const debouncedHandleScroll = useCallback(debaunce(handleScroll, 100), 
	[
		loading,
		page,
		reachedEnd,
	]);

	const handleSubmit = (e) => {
		e.preventDefault();
	};

	useEffect(() => {
		updatePage();
		window.scrollTo(0, 0);
	}, []);

	useEffect(() => {
		window.addEventListener("scroll", debouncedHandleScroll);
		return () => window.removeEventListener("scroll", debouncedHandleScroll);
	}, [loading]);

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
					value={search}
				/>
				<button type="submit" className="form__input">
					<FontAwesomeIcon icon={faMagnifyingGlass} size="xl" fixedWidth />
				</button>
			</form>

			{isEmptyList && (
				<p className="not-found-message">Não encontramos nada para "{search}" verifique se você digitou corretamente ou então  <Link to={"/feedback"}><strong>sugira sua obra para nós</strong></Link> para que poçamos adiciona-la no futuro</p>
			)}
			<div className="collection-container">
				{seriesList.map((series) => {
					const { _id, title, image } = series;
					return (
						<SeriesCard
							key={_id}
							seriesDetails={{ title, image, _id }}
						></SeriesCard>
					);
				})}
			</div>
		</div>
	);
}
