import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../../context/userProvider";
import {
	checkIfInWishlist,
	getCompletionPercentage,
	getSeriesStatus,
	printArray,
} from "./utils";
import "../../components/SeriesCard.css";
import { RiArrowDropDownLine } from "react-icons/ri";

export default function SeriesInfoCard({
	seriesInfo,
	actions, 
	infoToShow,
	setInfoToShow,
}) {
	const { user } = useContext(UserContext);
	const seriesSummarry = useRef(null);
	const [showingMore, setShowingMore] = useState(false);
	const [loaded, setLoaded] = useState(false);
	const [optionsVisible, setOptionsVisible] = useState(false);
	const [seriesInList, setSeriesInList] = useState(seriesInfo.inUserList);

	const {
		toggleSeriesInList,
		toggleWishlist,
		toggleDrop,
		handleSelectAllVolumes,
	} = actions;

	useEffect(() => {
		setShowingMore(
			seriesSummarry.current?.scrollHeight <=
				seriesSummarry.current?.clientHeight
		);
	}, [seriesInfo]);

	useEffect(() => {
		setSeriesInList(
			user &&
				user.userList.some(
					(seriesObj) => seriesObj.Series._id.toString() === seriesInfo.id
				)
		);
	}, [user]);

	const {
		id,
		seriesCover,
		title,
		publisher,
		authors,
		dimensions,
		summary,
		genres,
		isAdult,
	} = seriesInfo;

	return (
		<div className="series">
			<div className="series__image-wrapper">
				<div className="series-card__image-container">
					<img
						src={`${
							import.meta.env.REACT_APP_HOST_ORIGIN
						}/images/medium/${seriesCover}`}
						srcSet={`
							${import.meta.env.REACT_APP_HOST_ORIGIN}/images/small/${seriesCover} 100w,
							${import.meta.env.REACT_APP_HOST_ORIGIN}/images/medium/${seriesCover} 400w, 
							${import.meta.env.REACT_APP_HOST_ORIGIN}/images/large/${seriesCover} 700w,
							${
								import.meta.env.REACT_APP_HOST_ORIGIN
							}/images/extralarge/${seriesCover} 1000w,`}
						sizes=" (min-width: 768px) 360px, 
								(max-width: 768px) 100vw,"
						loading="lazy"
						alt={`cover volume ${title}`}
						className={`series-card__img ${!loaded && "series-card__img--loading"}`}
						onLoad={() => setLoaded(true)}
					/>
					{isAdult && <div className="series-card__adult-indicator">+18</div>}
				</div>
				<div className="series_main-info">
					<div className="series__butons-containers">
						<div>
							<div
								className={!seriesInList ? "button-select" : "button-select button-select--red"}
							>
								<strong
									className="button-select__option"
									onClick={() => {
										if (!user) return;
										// SIMPLE LOGIC CALL
										toggleSeriesInList(!seriesInList);
									}}
								>
									{!seriesInList ? "Adicionar" : "Remover"} coleção
								</strong>
								<div
									className="button-select__dropdown"
									onClick={() => setOptionsVisible((prev) => !prev)}
								>
									<RiArrowDropDownLine />
								</div>
							</div>
							<div
								className={`${
									optionsVisible
										? "button-select__options-container"
										: "button-select__options-container--hidden"
								}`}
							>
								<label htmlFor="select-all-check-mark" className="button-select__option">
									<strong>
										{user && getCompletionPercentage(user, id) === 1
											? "Remover todos"
											: "Adicionar todos"}
									</strong>
									<input
										type="checkbox"
										id="select-all-check-mark"
										className="checkmark invisible"
										disabled={!user}
										checked={user && getCompletionPercentage(user, id) === 1}
										onChange={(e) => {
											setOptionsVisible(false);
											handleSelectAllVolumes(e);
										}}
									/>
								</label>

								<div className="button-select__option">
									<label htmlFor="wishlist-check-mark" className="button-select__option">
										<strong>
											{user && checkIfInWishlist(user, id)
												? "Remover da lista de desejos"
												: "Adicionar à lista de desejos"}
										</strong>
										<input
											type="checkbox"
											id="wishlist-check-mark"
											className="checkmark invisible"
											disabled={!user}
											checked={user && checkIfInWishlist(user, id)}
											onChange={(e) => {
												setOptionsVisible(false);
												toggleWishlist(e.target.checked);
											}}
										/>
									</label>
								</div>

								<div className="button-select__option">
									<label htmlFor="drop-check-mark" className="button-select__option">
										<strong>
											{user && getSeriesStatus(user, id) === "Dropped"
												? "Voltar a colecionar"
												: "Abandonar(Dropar) coleção"}
										</strong>
										<input
											type="checkbox"
											id="drop-check-mark"
											className="checkmark invisible"
											disabled={!user}
											checked={user && getSeriesStatus(user, id) === "Dropped"}
											onChange={(e) => {
												setOptionsVisible(false);
												toggleDrop(e.target.checked);
											}}
										/>
									</label>
								</div>
							</div>
						</div>
					</div>

					<div className="series__mobile-options-container">
						<div
							className={`series__mobile-options series__mobile-options--${
								infoToShow === "details" && "selected"
							}`}
							onClick={() => setInfoToShow("details")}
						>
							Detalhes
						</div>
						<div
							className={`series__mobile-options series__mobile-options--${
								infoToShow === "volumes" && "selected"
							}`}
							onClick={() => setInfoToShow("volumes")}
						>
							Volumes
						</div>
					</div>
				</div>
			</div>

			<div
				className={`series__info-container mobile-appearence ${
					infoToShow !== "details" ? "" : "mobile-appearence--show"
				}`}
			>
				<h1>{title}</h1>
				<ul className="series__details-container">
					{publisher && (
						<li className="series__details">
							<strong>Editora:</strong> {publisher}
						</li>
					)}
					{authors?.length > 0 && (
						<li className="series__details">
							<strong>Autores:</strong> {printArray(authors)}
						</li>
					)}
					{dimensions?.length > 0 && (
						<li className="series__details">
							<strong>Formato:</strong> {dimensions.join("cm x ") + "cm"}
						</li>
					)}
					{genres?.length > 0 && (
						<li className="series__details">
							<strong>Generos:</strong> {printArray(genres)}
						</li>
					)}
					{summary?.length > 0 && (
						<li className="series__details" style={{ paddingBottom: "0px" }}>
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
						</li>
					)}
				</ul>
			</div>
		</div>
	);
}