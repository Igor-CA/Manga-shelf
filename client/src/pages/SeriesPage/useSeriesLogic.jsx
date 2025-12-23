import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../components/userProvider";
import { messageContext } from "../../components/messageStateProvider";
import { checkOwnedVolumes } from "./utils";
import { usePrompt } from "../../components/PromptContext";

export const useSeriesLogic = (id) => {
	const navigate = useNavigate();
	const { user, setOutdated, isFetching } = useContext(UserContext);
	const { confirm } = usePrompt();
	const { addMessage, setMessageType } = useContext(messageContext);

	const [series, setSeries] = useState(null);
	const [localVolumeState, setLocalVolumeState] = useState([]);

	useEffect(() => {
		const fetchSeriesData = async () => {
			try {
				const response = await axios.get(
					`${import.meta.env.REACT_APP_HOST_ORIGIN}/api/data/series/${id}`,
					{
						withCredentials: true,
						headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
					}
				);
				setSeries(response.data);
			} catch (error) {
				if (error.response?.status === 400) navigate("/404");
				console.error("Error fetching Series Data:", error);
			}
		};
		fetchSeriesData();
	}, [id, navigate]);

	useEffect(() => {
		if (!isFetching && !user?.allowAdult && series?.isAdult) {
			navigate("/");
		}
	}, [isFetching, user, navigate, series]);

	useEffect(() => {
		if (series?.title) {
			const newState = series.volumes.map((vol) => ({
				volumeId: vol.volumeId,
				ownsVolume: checkOwnedVolumes(user, vol.volumeId),
			}));
			setLocalVolumeState(newState);
		}
	}, [series, user]);

	const apiCall = async (endpoint, data, successMsg) => {
		try {
			await axios({
				method: "POST",
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}${endpoint}`,
				data: { id, ...data }, 
				withCredentials: true,
				headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
			});
			setOutdated(true); 
			if (successMsg) {
				setMessageType("Success");
				addMessage(successMsg);
			}
			return true;
		} catch (err) {
			const msg = err.response?.data?.msg || "Erro desconhecido";
			addMessage(msg);
			return false;
		}
	};

	
	const performVolumeUpdate = async (isAdding, idList) => {
		const endpoint = isAdding ? "/api/user/add-volume" : "/api/user/remove-volume";
		await apiCall(endpoint, {
			idList,
			amountVolumesFromSeries: series.volumes.length,
			seriesId: id,
			seriesStatus: series.status,
		});
	};

	const handleVolumeChange = (e, volumeId) => {
		const adding = e.target.checked;

		setLocalVolumeState((prev) =>
			prev.map((item) =>
				item.volumeId === volumeId ? { ...item, ownsVolume: adding } : item
			)
		);

		if (adding) {
			const index = localVolumeState.findIndex((v) => v.volumeId === volumeId);
			const listToAdd = localVolumeState
				.slice(0, index + 1)
				.filter((v) => !v.ownsVolume)
				.map((v) => v.volumeId);

			if (listToAdd.length > 1) {
				confirm(
					"Deseja adicionar os volumes anteriores também?",
					() => performVolumeUpdate(true, listToAdd),
					() => performVolumeUpdate(true, [volumeId])
				);
			} else {
				performVolumeUpdate(true, [volumeId]);
			}
		} else {
			performVolumeUpdate(false, [volumeId]);
		}
	};

	const handleSelectAllVolumes = (e) => {
		const adding = e.target.checked;
		const list = localVolumeState
			.filter((volume) => volume.ownsVolume === !adding)
			.map((volume) => volume.volumeId);

		const action = () => performVolumeUpdate(adding, list);

		if (!adding) {
			confirm("Deseja remover todos os volumes?", action);
		} else {
			action();
		}
	};


	const toggleSeriesInList = (isAdding) => {
		const action = () => 
			apiCall(
				isAdding ? "/api/user/add-series" : "/api/user/remove-series",
				{},
				`Obra ${isAdding ? "adicionada" : "removida"} com sucesso`
			);

		if (!isAdding) {
			confirm("Remover essa coleção também irá remover todos os seus volumes. Deseja prosseguir?", action);
		} else {
			action();
		}
	};

	const toggleWishlist = (isAdding) => {
		const action = () =>
			apiCall(
				isAdding ? "/api/user/add-to-wishlist" : "/api/user/remove-from-wishlist",
				{},
				`Obra ${isAdding ? "adicionada à" : "removida da"} lista de desejos`
			);

		if (!isAdding) {
			confirm("Deseja remover essa obra da lista de desejos?", action);
		} else {
			action();
		}
	};

	const toggleDrop = (dropping) => {
		const action = () =>
			apiCall(
				dropping ? "/api/user/drop-series" : "/api/user/undrop-series",
				{},
				`Obra ${dropping ? "abandonada" : "retomada"} com sucesso`
			);

		if (dropping) {
			confirm(
				"Deseja abandonar(droppar) essa obra? Obras abandonadas não aparecerão mais na lista de volumes faltosos.",
				action
			);
		} else {
			action();
		}
	};

	return {
		series,
		localVolumeState,
		handleVolumeChange,
		handleSelectAllVolumes,
		toggleSeriesInList,
		toggleWishlist,
		toggleDrop,
	};
};