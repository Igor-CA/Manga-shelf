import React, { useState, useEffect, useCallback } from "react";
import { SeriesCard } from "../../components/SeriesCard";
import "./BrowsePage.css";
import debaunce from "../../utils/debaunce";

export default function BrowsePage() {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(false);
	const [seriesList, setSeriesList] = useState([]);

	const fetchSeriesList = async () => {
		try {
			const response = await fetch(`${process.env.REACT_APP_HOST_ORIGIN}/admin?p=${page}`);
			const resultList = await response.json();
			return resultList;
		} catch (error) {
			console.error("Error fetching series list:", error);
		}
	};

	const updatePage = async () => {
		setLoading(true);
		try {
			const resultList = await fetchSeriesList();
			console.log(resultList);
			if (resultList.length > 0) {
				setSeriesList((prevList) =>
					page === 1 ? [...resultList] : [...prevList, ...resultList]
				);
				setPage(page + 1);
			}
		} catch (error) {
			console.error("Error fetching user Data:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (e) => {
		const inputValue = e.target.value;
		setSearch(inputValue);
		if (inputValue.trim() !== "") {
			debaunceSearch(inputValue);
		} else {
			updatePage();
		}
	};
	const fetchSearch = async (querry) => {
		if (querry.length > 1) {
			setLoading(true);
			try {
				const response = await fetch(`${process.env.REACT_APP_HOST_ORIGIN}/api/search?q=${querry}`);
				const data = await response.json();
				console.log(querry);
				if (data.length > 0) {
					setSeriesList(data);
					setLoading(false);
					setPage(1);
				}
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
		const scrollY = window.scrollY;
		const windowHeight = window.innerHeight;
		const contentHeight = document.documentElement.offsetHeight;

		const bottomOffset = contentHeight - (scrollY + windowHeight);
		const loadMoreThreshold = 200; // Adjust this value as needed

		if (bottomOffset < loadMoreThreshold && !loading && search.trim() === "") {
			updatePage();
		}
	};

	const handleSubmit = (e) => {
		e.preventDefault();
	};

	useEffect(() => {
		updatePage();
	}, []);

	useEffect(() => {
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [loading]);

	return (
		<div className="browse-collection-page">
			<form className="form" onSubmit={(e) => handleSubmit(e)}>
				<label htmlFor="search-bar" className="form__label">
					Pesquisa
				</label>
				<input
					type="text"
					name="search-bar"
					className="form__input"
					onChange={(e) => {
						handleChange(e);
					}}
					value={search}
				/>
			</form>

			{loading && <p>Carregando...</p>}
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
