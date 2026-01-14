import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import debaunce from "../utils/debaunce";
import { useContext } from "react";
import { messageContext } from "../components/messageStateProvider";

export const useFilterHandler = (
	fetchFiltersUrl,
	useURLParams = false,
	extraFetchParams = {},
	defaultOrdering = "popularity"
) => {
	const [searchParams, setSearchParams] = useSearchParams();
	const { addMessage } = useContext(messageContext);

	const getInitialParams = () => {
		if (!useURLParams) return {};
		const params = {};
		for (const [key, value] of searchParams.entries()) {
			params[key] = value;
		}
		return params;
	};

	const [params, setParams] = useState(() => {
		const paramsFromUrl = getInitialParams();
		return {
			ordering: defaultOrdering,
			...paramsFromUrl,
		};
	});
	const [genreList, setGenresList] = useState([]);
	const [publishersList, setPublishersList] = useState([]);
	const [typesList, setTypesList] = useState([]);
	const [originalYearList, setOriginalYearList] = useState([]);
	const [localYearList, setLocalYearList] = useState([]);

	const [searchBarValue, setSearchBarValue] = useState(
		params["search-bar"] || params["search"] || ""
	);

	const functionArguments = useMemo(() => [params], [params]);

	useEffect(() => {
		const fetchFiltersInfo = async () => {
			try {
				const res = await axios({
					method: "GET",
					withCredentials: true,
					headers: {
						Authorization: import.meta.env.REACT_APP_API_KEY,
					},
					url: fetchFiltersUrl,
					params: extraFetchParams,
				});
				setGenresList(res.data.genres);
				setPublishersList(res.data.publishers);
				setTypesList(res.data.types);
				setOriginalYearList(res.data.originalPublishedYears);
				setLocalYearList(res.data.publishedYears);
			} catch (err) {
				const customErrorMessage =
					err.response?.data?.msg || "Error fetching filter data";
				addMessage(customErrorMessage);
			}
		};
		fetchFiltersInfo();
	}, [fetchFiltersUrl, addMessage, JSON.stringify(extraFetchParams)]);

	const debouncedSearch = useCallback(
		debaunce((name, value) => {
			const newParams = { ...params, [name]: value };
			setParams(newParams);
			if (useURLParams) {
				setSearchParams(newParams);
			}
		}, 500),
		[params, useURLParams, setSearchParams]
	);

	const updateImmediate = (name, value) => {
		const newParams = { ...params, [name]: value };
		setParams(newParams);
		if (useURLParams) {
			setSearchParams(newParams);
		}
	};

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		const finalValue = type === "checkbox" ? (checked ? value : "") : value;
		if (name === "search" || name === "search-bar") {
			setSearchBarValue(finalValue);

			if (finalValue.trim() !== "") {
				debouncedSearch(name, finalValue);
			} else {
				const { [name]: removed, ...rest } = params;
				setParams(rest);
				if (useURLParams) setSearchParams(rest);
			}
		} else {
			if (finalValue.trim() !== "") {
				updateImmediate(name, finalValue);
			} else {
				const { [name]: removed, ...rest } = params;
				setParams(rest);
				if (useURLParams) setSearchParams(rest);
			}
		}
	};
	return {
		params,
		functionArguments,
		genreList,
		publishersList,
		typesList,
		localYearList,
		originalYearList,
		handleChange,
		searchBarValue,
	};
};
