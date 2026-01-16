import { useContext, useEffect, useRef, useState, useMemo } from "react";
import ActionDropdown from "./ActionsDropdown";
import "./SeriesPage.css";
import {
	checkIfInWishlist,
	getCompletionPercentage,
	getSeriesStatus,
	printArray,
} from "./utils";
import { UserContext } from "../../components/userProvider";
import SkeletonHeader from "../../components/SkeletonPage";
import ContentNavbar from "../../components/ContentNavbar";

export default function SeriesPageHeader({ seriesInfo, actions }) {
	const { user } = useContext(UserContext);
	const [showingMore, setShowingMore] = useState(false);
	const [loaded, setLoaded] = useState(false);
	const seriesSummarry = useRef(null);
	const {
		handleSelectAllVolumes,
		toggleSeriesInList,
		toggleWishlist,
		toggleDrop,
	} = actions;

	useEffect(() => {
		setShowingMore(
			seriesSummarry.current?.scrollHeight <=
				seriesSummarry.current?.clientHeight
		);
	}, [seriesInfo]);

	const handleLoading = () => {
		setLoaded(true);
	};
	const { seriesCover, title, summary, genres, authors, id } = seriesInfo || {};
	const dropdownOptions = [
		{
			label:
				user && getCompletionPercentage(user, id) === 1
					? "Remover todos os volumes"
					: "Adicionar todos os volumes",
			checked: user && getCompletionPercentage(user, id) === 1,
			onChange: handleSelectAllVolumes,
		},
		{
			label:
				user && checkIfInWishlist(user, id)
					? "Remover da lista de desejos"
					: "Adicionar à lista de desejos",
			checked: user && checkIfInWishlist(user, id),
			onChange: toggleWishlist,
		},
		{
			label:
				user && getSeriesStatus(user, id) === "Dropped"
					? "Voltar a colecionar"
					: "Abandonar (droppar) coleção",
			checked: user && getSeriesStatus(user, id) === "Dropped",
			onChange: toggleDrop,
		},
	];

	const navLinks = useMemo(
		() => [
			{ to: `/series/${seriesInfo?.id}`, label: "Geral", end: true },
			{ to: `/series/${seriesInfo?.id}/volumes`, label: "Volumes" },
			{ to: `/series/${seriesInfo?.id}/related`, label: "Obras Relacionadas" },
			/*
			{ to: `/series/${seriesInfo?.id}/reviews`, label: "Reviews" },
			{ to: `/series/${seriesInfo?.id}/user-volumes`, label: "Seus volumes" }, //Conditioned rendered
			*/
		],
		[seriesInfo]
	);
	const isSeriesInUserList =
		user?.userList?.some(
			(seriesObj) =>
				seriesObj.Series._id.toString() === id || seriesObj.Series === id
		) ?? false;
	const mainAction = {
		label: !isSeriesInUserList ? "Adicionar coleção" : "Remover coleção",
		isRed: isSeriesInUserList,
		onClick: () => toggleSeriesInList(!isSeriesInUserList),
	};
	return seriesInfo ? (
		<header className="content-header">
			<div className="header__bg-image-container">
				<div
					style={{
						backgroundImage: `url("${
							import.meta.env.REACT_APP_HOST_ORIGIN
						}/images/medium/${seriesCover}")`,
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
						<div className="header__cover-image-container">
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
								className={`header__cover-image ${
									!loaded && "header__cover-image--loading"
								}`}
								onLoad={handleLoading}
							/>
							{seriesInfo.isAdult && (
								<div className="series-card__adult-indicator">+18</div>
							)}
						</div>
						<ActionDropdown
							mainAction={mainAction}
							options={dropdownOptions}
							isDisabled={!user}
						/>
					</div>
					<div className="header__main-info-container">
						<div className="header__title-container">
							<h1 className="content-title">{title}</h1>
							{authors?.length > 0 && (
								<span className="content-author">
									Obra de: {authors && printArray(authors)}
								</span>
							)}
						</div>
						<div className="header__secondary-info">
							<ul className="header__genres-list">
								{genres.map((genre, index) => {
									return (
										<li className="header__genre-tag" key={index}>
											{genre}
										</li>
									);
								})}
							</ul>
						</div>
					</div>
				</div>

				{summary?.length > 0 && (
					<div className="content__details-summary">
						<strong>Sinopse:</strong>
						<div
							ref={seriesSummarry}
							className={`content__summary ${
								showingMore ? "content__summary--show-full" : ""
							}`}
						>
							{summary.map((paragraph, i) => (
								<p key={i}>{paragraph}</p>
							))}
						</div>
						{!showingMore && (
							<button
								className="show-more__button"
								aria-label="Mostrar mais"
								onClick={() => setShowingMore(true)}
							>
								Mostrar mais
							</button>
						)}
					</div>
				)}
			</div>
			<ContentNavbar links={navLinks} />
		</header>
	) : (
		<SkeletonHeader></SkeletonHeader>
	);
}
