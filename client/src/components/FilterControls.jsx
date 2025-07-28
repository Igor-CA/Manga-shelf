import React from "react";

const FilterControls = ({
	availableFilters,
	values,
	handleChange,
	lists,
	children,
}) => {
	const { searchBarValue } = values;
	const { genreList, publishersList } = lists;

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

			<div className="filter__types">
				{availableFilters.includes("genre") && (
					<label htmlFor="genre" className="filter__label">
						Gêneros
						<select
							name="genre"
							id="genre"
							className="form__input filter__input"
							onChange={handleChange}
							defaultValue={values.genre || ""}
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
							defaultValue={values.publisher || ""}
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
							defaultValue={values.status || ""}
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
							defaultValue={values.ordering || "popularity"}
						>
							{availableFilters.includes("ordering_status") && (
								<option value={"status"}>Status</option>
							)}
							<option value={"title"}>Alfabética</option>
							<option value={"popularity"}>Popularidade</option>
							<option value={"volumes"}>Tamanho</option>
							<option value={"publisher"}>Editora</option>
						</select>
					</label>
				)}

				{children}
			</div>
		</form>
	);
};

export default FilterControls;
