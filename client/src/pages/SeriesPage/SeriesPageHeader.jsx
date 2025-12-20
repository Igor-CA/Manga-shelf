import { useEffect, useRef, useState } from "react";
import ActionDropdown from "./ActionsDropdown";
import "./SeriesPageRedesign.css";
import { printArray } from "./utils";

export default function SeriesPageHeader({ seriesInfo, user }) {
	const [showingMore, setShowingMore] = useState(false);
	const [loaded, setLoaded] = useState(false);
	const seriesSummarry = useRef(null);
	useEffect(() => {
		setShowingMore(
			seriesSummarry.current?.scrollHeight <=
				seriesSummarry.current?.clientHeight
		);
	}, [seriesInfo]);
	const handleLoading = () => {
		setLoaded(true);
	};
	//Todo variable fixed just for testing
	const seriesInList = false
	const { seriesCover, title, summary, genres, authors } = seriesInfo;
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
		<header className="content-header">
			<div className="header__bg-image-container">
				<div
					style={{
						backgroundImage: `url('${
							import.meta.env.REACT_APP_HOST_ORIGIN
						}/images/medium/${seriesCover}')`,
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
							}/images/medium/${seriesCover}`}
							srcSet={
								`${
									import.meta.env.REACT_APP_HOST_ORIGIN
								}/images/small/${seriesCover} 100w,` +
								`${
									import.meta.env.REACT_APP_HOST_ORIGIN
								}/images/medium/${seriesCover} 400w,` +
								`${
									import.meta.env.REACT_APP_HOST_ORIGIN
								}/images/large/${seriesCover} 700w,` +
								`${
									import.meta.env.REACT_APP_HOST_ORIGIN
								}/images/extralarge/${seriesCover} 1000w,`
							}
							sizes=" (min-width: 768px) 360px, 
                                            (max-width: 768px) 100vw,"
							loading="lazy"
							alt={`cover volume ${title}`}
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
							<h1 className="content-title">{title}</h1>
							<span className="content-author">
								Obra de: {authors && printArray(authors)}
							</span>
						</div>
						<div className="header__secondary-info">
							<ul className="header__genres-list">
								{genres.map((genre, index) => {
									return <li className="header__genre-tag" key={index}>{genre}</li>;
								})}
							</ul>
						</div>
					</div>
				</div>

				{summary?.length > 0 && (
					<div className="series__details-summary">
						<strong>Sinopse:</strong>
						<div
							ref={seriesSummarry}
							className={`series__summary ${
								showingMore ? "series__summary--show-full" : ""
							}`}
						>
							{summary.map((paragraph, i) => (
								<p key={i}>{paragraph}</p>
							))}
						</div>
						{!showingMore && (
							<button
								className="series__show-more"
								aria-label="Mostrar mais"
								onClick={() => setShowingMore(true)}
							>
								Mostrar mais
							</button>
						)}
					</div>
				)}
			</div>
		</header>
	);
}
