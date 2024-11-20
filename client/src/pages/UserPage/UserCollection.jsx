import { Link, useNavigate, useParams } from "react-router-dom";
import SeriesCardList from "../../components/SeriesCardList";
import axios from "axios";
import { useCallback, useMemo, useState } from "react";
import debaunce from "../../utils/debaunce";

const genreList = [
	"Action",
];
const publishersList = [
	"Viz media",
];
export default function UserCollection() {
	const { username } = useParams();
	const navigate = useNavigate();
	const [params, setParams] = useState({});
	const functionArguments = useMemo(() => [params], [params]);

	const querryUserList = async (page) => {
		try {
			const res = await axios({
				method: "GET",
				withCredentials: true,
				headers: {
					Authorization: process.env.REACT_APP_API_KEY,
				},
				params: {
					p: page,
					...params
				},
				url: `/api/data/user/${username}`,
			});
			const result = res.data;
			return result;
		} catch (error) {
			const errorType = error.response.status;
			if (errorType === 400) {
				navigate("/404");
			}
		}
	};

	const EmptyListComponent = () => {
		return (
			<p className="not-found-message">
				Esta conta não possuí nenhuma coleção registrada. Caso essa seja
				sua conta tente{" "}
				<Link to={"/browse"}>
					<strong>
						adicionar suas coleções buscando em nossa página de
						busca
					</strong>
				</Link>{" "}
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
			console.log(name, value)
			setParams({ ...params, [name]: value });
		}, 500),
		[params]
	);
	return (
		<div className="user-collection container">
			<div className="filter">
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
							<option value={"added"}>Adicionados</option>
							<option value={"volumes"}>Tamanho</option>
							<option value={"publisher"}>Editora</option>
							<option value={"status"}>Status</option>
						</select>
					</label>

				</div>
			</div>
			<SeriesCardList
				skeletonsCount={36}
				fetchFunction={querryUserList}
				errorComponent={EmptyListComponent}
				functionArguments={functionArguments}
			></SeriesCardList>
		</div>
	);
}
