import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "../SeriesPage/SeriesPage.css";
import SeriesCardList from "../../components/SeriesCardList";
import { useCallback, useMemo, useState } from "react";
import debaunce from "../../utils/debaunce";

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

export default function WishlistPage() {
	const { username } = useParams();
	const navigate = useNavigate();

	const [params, setParams] = useState({});
	const functionArguments = useMemo(() => [params], [params]);
	const fetchMissingVolumes = async (page) => {
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
				url: `${
					import.meta.env.REACT_APP_HOST_ORIGIN
				}/api/data/user/${username}/wishlist`,
			});
			const responseData = response.data;
			return responseData;
		} catch (error) {
			const errorType = error.response.status;
			if (errorType === 400) {
				navigate("/404");
			}
			console.error(
				"Error fetching Missing volumes data:",
				error.response.data.msg
			);
		}
	};

	const EmptyListComponent = () => {
		return (
			<p className="not-found-message">
				Esta conta não possuí nada na lista de desejos.
			</p>
		);
	};
	const handleChange = (e) => {
		const { name, value } = e.target;
		if (value.trim() !== "" || value === null) {
			debouncedSearch(name, value);
		} else {
			setParams({ ...params, [name]: value });
		}
	};

	const debouncedSearch = useCallback(
		debaunce((name, value) => {
			setParams({ ...params, [name]: value });
		}, 500),
		[params]
	);

	return (
		<div className="container">
			<div className="filter">
				<div className="filter__search">
					<label htmlFor="search" className="filter__label">
						Buscar
						<input
							type="text"
							name="search"
							id="search"
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
							<option value={"popularity"}>Popularidade</option>
							<option value={"volumes"}>Tamanho</option>
							<option value={"publisher"}>Editora</option>
							<option value={"status"}>Status</option>
						</select>
					</label>
				</div>
			</div>
			<SeriesCardList
				skeletonsCount={36}
				fetchFunction={fetchMissingVolumes}
				itemType="Series"
				errorComponent={EmptyListComponent}
				functionArguments={functionArguments}
				showActions={true}
			></SeriesCardList>
		</div>
	);
}
