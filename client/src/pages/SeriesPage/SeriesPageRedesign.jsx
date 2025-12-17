import "./SeriesPageRedesign.css";
import ActionDropdown from "./ActionsDropdown";
import { useNavigate, useParams } from "react-router-dom";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { UserContext } from "../../components/userProvider";
import axios from "axios";
import { printArray } from "./utils";
export default function SeriesPageRedesign() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { user, setOutdated, isFetching } = useContext(UserContext);
	const seriesSummarry = useRef(null);
	const [showingMore, setShowingMore] = useState(false);
	const [series, setSeries] = useState();
	const [localVolumeState, setLocalVolumeState] = useState();
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [confirmationMessage, setConfirmationMessage] = useState("");
	const [onConfirm, setOnConfirm] = useState(null);
	const [onCancel, setOnCancel] = useState(null);

	const [loaded, setLoaded] = useState(false);
	const handleLoading = () => {
		setLoaded(true);
	};
	useEffect(() => {
		const fetchSeriesData = async () => {
			try {
				const response = await axios.get(
					`${import.meta.env.REACT_APP_HOST_ORIGIN}/api/data/series/${id}`,
					{
						withCredentials: true,
						headers: {
							Authorization: import.meta.env.REACT_APP_API_KEY,
						},
					}
				);
				const responseData = response.data;
				setSeries(responseData);
			} catch (error) {
				const errorType = error.response.status;
				if (errorType === 400) {
					navigate("/404");
				}
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
	const detailsSchema = useMemo(() => {
		if (!series) return [];

		return [
			{ label: "Autores", value: printArray(series.authors) },
			{ label: "Editora", value: series.publisher },
			{ label: "Gêneros", value: series.genres },
			{ label: "Formato", value: series.dimmensions.join("cm x ") + "cm" },
			{ label: "Situação no Japão", value: series.statusJapan },
			{ label: "Situação no Brasil", value: series.statusBrazil },
			{ label: "Quantidade de capítulos", value: series.chaptersCount },
			{ label: "Volumes no Japão", value: series.volumesJapan },
			{ label: "Volumes no Brasil", value: series.volumesBrazil },
			{ label: "Data de lançamento Japão", value: series.releaseDateJapan },
			{ label: "Data de lançamento Brasil", value: series.releaseDateBrazil },
			{ label: "Data de conclusão Japão", value: series.endDateJapan },
			{ label: "Tipo de papel", value: series.paperType },
			{ label: "Tipo de capa", value: series.coverType },
			{
				label: "Popularidade",
				value: series.popularity,
				suffix: " usuários possuem ou querem essa obra",
			},
			{ label: "Tipo", value: series.type },
			{ label: "Demografia", value: series.demographics },
		];
	}, [series]);
	const seriesInList = false;
	const dropdownOptions = [
		{
			label: "Adicionar todos",
			//user && getCompletionPercentage(user, id) === 1
			//? "Remover todos"
			//: "Adicionar todos",
			checked: true, //user //&& getCompletionPercentage(user, id) === 1,
			onChange: () => console.log("adicionar todos"),
		},
		{
			label: "Adicionar aos desejos",
			//user && checkIfInWishlist(user, id)
			//? "Remover da lista"
			//: "Adicionar aos desejos",
			checked: true, //user && checkIfInWishlist(user, id),
			onChange: () => console.log("Adicionado aos desejos"), //handleWishlistAction, // Pass your existing logic here
		},
		{
			label: "Abandonar colecaao",
			//user && getSeriesStatus(user, id) === "Dropped"
			//? "Voltar a colecionar"
			//: "Abandonar coleção",
			checked: true, // user && getSeriesStatus(user, id) === "Dropped",
			onChange: () => console.log("dropped"), //handleDropSeriesAction,
		},
	];
	const mainAction = {
		label: !seriesInList ? "Adicionar coleção" : "Remover coleção",
		isRed: seriesInList,
		onClick: () => console.log("adding series"),
		//() =>
		//seriesInList ? handleRemoveSeries() : addOrRemoveSeries(true),
	};
	return (
		<div className="page-content">
			{series && (
				<>
					<header className="content-header">
						<div className="header__bg-image-container">
							<div
								style={{
									backgroundImage: `url('${
										import.meta.env.REACT_APP_HOST_ORIGIN
									}/images/medium/${series.seriesCover}')`,
								}}
								className="header__bg-image"
								role="img"
								aria-label="background-image"
							></div>
							<div className="banner-shade"></div>
						</div>
						<div className="container">
							<div className="header-container">
								<div className="header__art-container">
									<img
										src={`${
											import.meta.env.REACT_APP_HOST_ORIGIN
										}/images/medium/${series.seriesCover}`}
										srcSet={`
                                        ${
																					import.meta.env.REACT_APP_HOST_ORIGIN
																				}/images/small/
                                        ${series.seriesCover} 100w,
                                        ${
																					import.meta.env.REACT_APP_HOST_ORIGIN
																				}/images/medium/${
											series.seriesCover
										} 400w, 
                                        ${
																					import.meta.env.REACT_APP_HOST_ORIGIN
																				}/images/large/${
											series.seriesCover
										} 700w,
                                        ${
																					import.meta.env.REACT_APP_HOST_ORIGIN
																				}/images/extralarge/${
											series.seriesCover
										} 1000w,`}
										sizes=" (min-width: 768px) 360px, 
                                            (max-width: 768px) 100vw,"
										loading="lazy"
										alt={`cover volume ${series.title}`}
										className={`header__cover-image-container ${
											!loaded && "series-card__img--loading"
										}`}
										onLoad={handleLoading}
									/>
									<ActionDropdown
										mainAction={mainAction}
										options={dropdownOptions}
										isDisabled={!user}
									/>
								</div>
								<div className="header__main-info-container">
									<div className="header__title-container">
										<h1 className="content-title">{series?.title}</h1>
										<span className="content-author">
											Obra de: {series && printArray(series?.authors)}
										</span>
									</div>
									<div className="header__secondary-info">
										<ul className="header__genres-list">
											{series.genres.map((genre) => {
												return <li className="header__genre-tag">{genre}</li>;
											})}
										</ul>
									</div>
								</div>
							</div>

							{series.summary?.length > 0 && (
								<div className="series__details-summary">
									<strong>Sinopse:</strong>
									<div
										ref={seriesSummarry}
										className={`series__summary ${
											showingMore ? "series__summary--show-full" : ""
										}`}
									>
										{series.summary.map((paragraph, i) => (
											<p key={i}>{paragraph}</p>
										))}
									</div>
									{!showingMore && (
										<button
											className="series__show-more"
											onClick={() => setShowingMore(true)}
										>
											Mostrar mais
										</button>
									)}
								</div>
							)}
						</div>
					</header>
					<div className="container">
						<ul className="all-info-container">
							{detailsSchema.map((item, index) => {
								if (
									!item.value ||
									(Array.isArray(item.value) && item.value.length === 0)
								) {
									return null;
								}

								return (
									<li key={index}>
										<strong>{item.label}: </strong>
										{item.value}
										{item.suffix && <span>{item.suffix}</span>}
									</li>
								);
							})}
						</ul>
					</div>
				</>
			)}
		</div>
	);
}
