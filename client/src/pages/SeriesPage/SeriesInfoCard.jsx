import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../../components/userProvider";
import axios from "axios";
import {
	checkIfInWishlist,
	customWindowConfirm,
	getCompletionPercentage,
	getSeriesStatus,
	printArray,
} from "./utils";
import "../../components/SeriesCard.css";
import { RiArrowDropDownLine } from "react-icons/ri";
import { messageContext } from "../../components/messageStateProvider";

export default function SeriesInfoCard({
	seriesInfo,
	addOrRemoveVolume,
	localVolumeList,
	windowSetters,
	infoToShow,
	setInfoToShow,
}) {
	const { user, setOutdated } = useContext(UserContext);
	const seriesSummarry = useRef(null);
	const [showingMore, setShowingMore] = useState(false);
	const [loaded, setLoaded] = useState(false);
	const [optionsVisible, setOptionsVisible] = useState(false);
	const { addMessage, setMessageType } = useContext(messageContext);
	const [seriesInList, setSeriesInList] = useState(
		user &&
			user.userList.some(
				(seriesObj) => seriesObj.Series._id.toString() === seriesInfo.id
			)
	);
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
	}, [user, setOutdated]);
	const handleLoading = () => {
		setLoaded(true);
	};
	const {
		id,
		seriesCover,
		title,
		publisher,
		authors,
		dimmensions,
		summary,
		genres,
		isAdult,
	} = seriesInfo;

	const addOrRemoveSeries = async (isAdding) => {
		try {
			const url = isAdding
				? `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/add-series`
				: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/remove-series`;

			await axios({
				method: "POST",
				data: { id },
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				url: url,
			});
			setMessageType("Success")
			addMessage(`Obra ${isAdding?"adicionada":"removida"} com sucesso`)
			setOutdated(true);
		} catch (err) {
			console.log(err);
		}
	};

	const addOrRemoveFromWishList = async (isAdding) => {
		try {
			const url = isAdding
				? `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/add-to-wishlist`
				: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/remove-from-wishlist`;

			await axios({
				method: "POST",
				data: { id },
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				url: url,
			});
			setOutdated(true);
			setMessageType("Success")
			addMessage(`Obra ${isAdding?"adicionada à lista de desejos":"removida da lista de desejos"} com sucesso`)
		} catch (err) {
			console.log(err);
		}
	};
	const handleSelectAll = (e) => {
		if (!user) {
			return;
		}
		setOptionsVisible(false)
		const adding = e.target.checked;
		const list = localVolumeList
			.filter((volume) => volume.ownsVolume === !adding)
			.map((volume) => {
				return volume.volumeId;
			});
		if (!adding) {
			customWindowConfirm(
				windowSetters,
				"Deseja remover todos os volumes?",
				() => addOrRemoveVolume(adding, list),
				null
			);
		} else {
			addOrRemoveVolume(adding, list);
		}
	};

	const handleDropSeries = (e) => {
		const adding = e.target.checked;
		setOptionsVisible(false)
		console.log(`${adding ? "Adding" : "Removing"} to dropped`);
	};

	const handleWishlist = (e) => {
		const adding = e.target.checked;
		setOptionsVisible(false)
		if (!adding) {
			customWindowConfirm(
				windowSetters,
				"Deseja remover essa obra da lista de desejos?",
				() => addOrRemoveFromWishList(adding),
				null
			);
		} else {
			addOrRemoveFromWishList(adding)
		}
	};

	const handleRemoveSeries = () => {
		customWindowConfirm(
			windowSetters,
			"Remover essa coleção também irá remover todos os seus volumes deseja prosseguir?",
			() => addOrRemoveSeries(false),
			null
		);
	};

	const handleOptionsClick = () => {
		console.log("ha")
		setOptionsVisible((prev) => !prev);
	};

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
						className={`series-card__img ${
							!loaded && "series-card__img--loading"
						}`}
						onLoad={handleLoading}
					/>
					{isAdult && <div className="series-card__adult-indicator">+18</div>}
				</div>
				<div className="series_main-info">
					{
						<div className="series__butons-containers">
							<div>
								<div
									className={
										!seriesInList
											? "button-select"
											: "button-select button-select--red"
									}
								>
									<strong
										className="button-select__option"
										onClick={() => {
											if (!user) {
												return;
											}
											seriesInList
												? handleRemoveSeries()
												: addOrRemoveSeries(true);
										}}
									>
										{!seriesInList ? "Adicionar" : "Remover"} coleção
									</strong>
									<div
										className="button-select__dropdown"
										onClick={handleOptionsClick}
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
									<label
										htmlFor="select-all-check-mark"
										className="button-select__option"
										>
										<strong>
											{user && getCompletionPercentage(user, id) === 1
												? "Remover todos"
												: "Adicionar todos"}
										</strong>
										<input
											type="checkbox"
											name="select-all-check-mark"
											id="select-all-check-mark"
											className="checkmark invisible"
											disabled={user ? false : true}
											checked={
												user && getCompletionPercentage(user, id) === 1
													? true
													: false
											}
											onChange={handleSelectAll}
										/>
									</label>
									<div className="button-select__option">
										<label
											htmlFor="wishlist-check-mark"
											className="button-select__option"
										>
											<strong>
												{user && checkIfInWishlist(user, id)
													? "Remover da lista de desejos"
													: "Adicionar à lista de desejos"}
											</strong>
											<input
												type="checkbox"
												name="wishlist-check-mark"
												id="wishlist-check-mark"
												className="checkmark invisible"
												disabled={user ? false : true}
												checked={
													user && checkIfInWishlist(user, id)
												}
												onChange={handleWishlist}
											/>
										</label>
									</div>
									<div className="button-select__option">
										<label
											htmlFor="drop-check-mark"
											className="button-select__option"
										>
											<strong>
												{user && getSeriesStatus(user, id) === "Dropped"
													? "Voltar a colecionar"
													: "Desistir (Dropar) da coleção"}
											</strong>
											<input
												type="checkbox"
												name="drop-check-mark"
												id="drop-check-mark"
												className="checkmark invisible"
												disabled={user ? false : true}
												checked={
													user && getSeriesStatus(user, id) === "Dropped"
														? true
														: false
												}
												onChange={handleDropSeries}
											/>
										</label>
									</div>
								</div>
							</div>
						</div>
					}
					<div className="series__mobile-options-container">
						<div
							className={`series__mobile-options series__mobile-options--${
								infoToShow === "details" && "selected"
							}`}
							onClick={() => {
								setInfoToShow("details");
							}}
						>
							Detalhes
						</div>
						<div
							className={`series__mobile-options series__mobile-options--${
								infoToShow === "volumes" && "selected"
							}`}
							onClick={() => {
								setInfoToShow("volumes");
							}}
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
					{dimmensions?.length > 0 && (
						<li className="series__details">
							<strong>Formato:</strong> {dimmensions.join("cm x ") + "cm"}
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
								{summary.map((paragraph, i) => {
									return <p key={i}>{paragraph}</p>;
								})}
							</div>
							{!showingMore && (
								<button
									className="series__show-more"
									aria-label="Mostrar mais"
									onClick={() => {
										setShowingMore(true);
									}}
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
