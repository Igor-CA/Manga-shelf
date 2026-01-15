import { useState } from "react";
import { BsThreeDots } from "react-icons/bs";

const FilterControls = ({
	availableFilters,
	values,
	handleChange,
	lists,
	children,
	secundaryFilters = false,
}) => {
	const [showFilters, setShowFilters] = useState(false);
	const { searchBarValue } = values;
	const {
		genreList,
		publishersList,
		typesList,
		countryList,
		localYearList,
		originalYearList,
	} = lists;

	const searchName = availableFilters.includes("search-bar")
		? "search-bar"
		: "search";

	return (
		<form className="filter" onSubmit={(e) => e.preventDefault()}>
			<div className="filter__search">
				{availableFilters.includes("search") && (
					<label htmlFor={searchName} className="filter__label">
						Buscar
						<input
							type="text"
							name={searchName}
							id={searchName}
							autoComplete="off"
							placeholder="Buscar"
							className="form__input filter__input filter__input--grow"
							onChange={handleChange}
							value={searchBarValue}
						/>
					</label>
				)}
			</div>
			<div className="filter__container">
				<div className="filter__primary">
					{availableFilters.includes("genre") && (
						<label htmlFor="genre" className="filter__label">
							Gêneros
							<select
								name="genre"
								id="genre"
								className="form__input filter__input"
								onChange={handleChange}
								value={values.genre || ""}
							>
								<option value="">Selecionar</option>
								{genreList?.map((genre, id) => (
									<option value={genre} key={id}>
										{genre}
									</option>
								))}
							</select>
						</label>
					)}

					{availableFilters.includes("publisher") && (
						<label htmlFor="publisher" className="filter__label">
							Editora
							<select
								name="publisher"
								id="publisher"
								className="form__input filter__input"
								onChange={handleChange}
								value={values.publisher || ""}
							>
								<option value="">Selecionar</option>
								{publishersList?.map((publisher, id) => (
									<option value={publisher} key={id}>
										{publisher}
									</option>
								))}
							</select>
						</label>
					)}
					{availableFilters.includes("status") && (
						<label htmlFor="status" className="filter__label">
							Situação
							<select
								name="status"
								id="status"
								className="form__input filter__input"
								onChange={handleChange}
								value={values.status || ""}
							>
								<option value="">Selecionar</option>
								<option value={"Finalizado"}>Finalizado</option>
								<option value={"Em andamento"}>Em andamento</option>
								<option value={"Em publicação"}>Em publicação no Brasil</option>
								<option value={"Hiatus"}>Hiatus</option>
								<option value={"Cancelado"}>Cancelado</option>
							</select>
						</label>
					)}

					{availableFilters.includes("ordering") && (
						<label htmlFor="ordering" className="filter__label">
							Ordem
							<select
								name="ordering"
								id="ordering"
								className="form__input filter__input"
								onChange={handleChange}
								value={values.ordering || "popularity"}
							>
								<option value={"title"}>Alfabética</option>
								<option value={"popularity"}>Popularidade</option>
								<option value={"volumes"}>Tamanho</option>
								<option value={"publisher"}>Editora</option>
								<option value={"dateJp"}>Lançamentos Recentes (JP)</option>
								<option value={"dateBr"}>Lançamentos Recentes (BR)</option>
								{availableFilters.includes("ordering_percentage") && (
									<option value={"status"}>Porcentagem de conclusão</option>
								)}
							</select>
						</label>
					)}
					{children}
				</div>
				{secundaryFilters === true && (
					<>
						<button
							type="button"
							className={`button button--primary filter__toggle-btn ${
								showFilters ? "active" : ""
							}`}
							onClick={() => setShowFilters(!showFilters)}
						>
							<BsThreeDots />
						</button>
						<div className={`filter__secondary ${showFilters ? "open" : ""}`}>
							<label htmlFor="demographic" className="filter__label">
								Demografia
								<select
									name="demographic"
									id="demographic"
									className="form__input filter__input"
									onChange={handleChange}
									value={values.demographic || ""}
								>
									<option value="">Selecionar</option>
									<option value={"Shounen"}>Shounen</option>
									<option value={"Shoujo"}>Shoujo</option>
									<option value={"Seinen"}>Seinen</option>
									<option value={"Josei"}>Josei</option>
									<option value={"Kodomo"}>Kodomo (Infantil)</option>
								</select>
							</label>

							<label htmlFor="type" className="filter__label">
								Tipo
								<select
									name="type"
									id="type"
									className="form__input filter__input"
									onChange={handleChange}
									value={values.type || ""}
								>
									<option value="">Selecionar</option>
									{typesList?.map((type, id) => (
										<option value={type} key={id}>
											{type}
										</option>
									))}
								</select>
							</label>

							<label htmlFor="country" className="filter__label">
								País de origem
								<select
									name="country"
									id="country"
									className="form__input filter__input"
									onChange={handleChange}
									value={values.country || ""}
								>
									<option value="">Selecionar</option>
									{countryList?.map((country, id) => (
										<option value={country} key={id}>
											{country}
										</option>
									))}
								</select>
							</label>

							<label htmlFor="publishedAtJp" className="filter__label">
								Ano (Japão)
								<select
									name="publishedAtJp"
									id="publishedAtJp"
									className="form__input filter__input"
									onChange={handleChange}
									value={values.publishedAtJp || ""}
								>
									<option value="">Selecionar</option>
									{originalYearList?.map((year, id) => (
										<option value={year} key={id}>
											{year}
										</option>
									))}
								</select>
							</label>
							<label htmlFor="publishedAtBr" className="filter__label">
								Ano (Brasil)
								<select
									name="publishedAtBr"
									id="publishedAtBr"
									className="form__input filter__input"
									onChange={handleChange}
									value={values.publishedAtBr || ""}
								>
									<option value="">Selecionar</option>
									{localYearList?.map((year, id) => (
										<option value={year} key={id}>
											{year}
										</option>
									))}
								</select>
							</label>
							{values.onlyOwned !== "on" && (
								<div className="filter__checkbox-container">
									<label htmlFor="hideOwned" className="filter__label">
										Esconder mangás nas suas lista
										<input
											type="checkbox"
											name="hideOwned"
											id="hideOwned"
											className="filter__checkbox"
											onChange={handleChange}
											checked={values.hideOwned === "on"}
										/>
									</label>
								</div>
							)}
							{values.hideOwned !== "on" && (
								<div className="filter__checkbox-container">
									<label htmlFor="onlyOwned" className="filter__label">
										Mostrar apenas mangás nas suas lista
										<input
											type="checkbox"
											name="onlyOwned"
											id="onlyOwned"
											className="filter__checkbox"
											onChange={handleChange}
											checked={values.onlyOwned === "on"}
										/>
									</label>
								</div>
							)}
						</div>
					</>
				)}
			</div>
		</form>
	);
};

export default FilterControls;
