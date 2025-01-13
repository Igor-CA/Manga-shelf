import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../../components/userProvider";
import axios from "axios";
import {
	customWindowConfirm,
	getCompletionPercentage,
	printArray,
} from "./utils";
import AddOrRemoveButton from "./AddRemoveButton";

import "../../components/SeriesCard.css";
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

	useEffect(() => {
		setShowingMore(
			seriesSummarry.current?.scrollHeight <=
				seriesSummarry.current?.clientHeight
		);
	}, [seriesInfo]);

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
		isAdult
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
			setOutdated(true);
		} catch (err) {
			console.log(err);
		}
	};

	const handleSelectAll = (e) => {
		if (!user) {
			return;
		}
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

	const handleRemoveSeries = () => {
		customWindowConfirm(
			windowSetters,
			"Remover essa coleção também irá remover todos os seus volumes deseja prosseguir?",
			() => addOrRemoveSeries(false),
			null
		);
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
							<label htmlFor="select-all-check-mark" className="button">
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
							<AddOrRemoveButton
								user={user}
								seriesId={id}
								handleRemoveSeries={handleRemoveSeries}
								addOrRemoveSeries={addOrRemoveSeries}
							></AddOrRemoveButton>
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
