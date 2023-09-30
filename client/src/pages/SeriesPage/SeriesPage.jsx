import { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./SeriesPage.css";
import { UserContext } from "../../components/userProvider";
import axios from "axios";
import PromptConfirm from "../../components/PromptConfirm";

export default function SeriesPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { user, setOutdated } = useContext(UserContext);
	const [series, setSeries] = useState({
		title: "",
		publisher: "",
		seriesCover: "",
		authors: [],
		volumes: [],
	});
	const [localVolumeState, setLocalVolumeState] = useState();
	const [infoToShow, setInfoToShow] = useState("details");
	const [contentTopValue, setContentTopValue] = useState();
	const [onMobile, setOnMobile] = useState(false);
	const [showingMore, setShowingMore] = useState(false);
	const [needShowButton, setNeedShowButon] = useState(false);

	const [showConfirmation, setShowConfirmation] = useState(false);
	const [confirmationMessage, setConfirmationMessage] = useState("");
	const [onConfirm, setOnConfirm] = useState(null);
	const [onCancel, setOnCancel] = useState(null);
	const mainInfo = useRef(null);
	const seriesCoverImage = useRef(null);
	const seriesSummarry = useRef(null);

	useEffect(() => {
		const fetchSeriesData = async () => {
			try {
				const response = await axios.get(
					`${process.env.REACT_APP_HOST_ORIGIN}/api/series/${id}`
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
	}, []);

	useEffect(() => {
		if (series.title !== "") {
			const newLocalVolumeState = series.volumes.map((volume) => {
				const { volumeId } = volume;
				const ownsVolume = checkOwnedVolumes(volumeId);
				return { volumeId, ownsVolume };
			});
			setLocalVolumeState(newLocalVolumeState);
		}

		const handleResize = () => {
			setOnMobile(window.innerWidth < 768);
			if (window.innerWidth < 768) {
				const contentTop = `calc(${mainInfo.current.offsetHeight}px + ${
					seriesCoverImage.current.offsetHeight * 0.6
				}px)`;
				setContentTopValue(contentTop);
				const footer = document.querySelector(".footer");
				const content = document.querySelector(".series__content");

				footer.style.position = "absolute";
				footer.style.top = `calc(${
					mainInfo.current.offsetHeight + content.offsetHeight
				}px + ${seriesCoverImage.current.offsetHeight * 0.6}px)`;
			}

			//Show the button show more on summary
			setNeedShowButon(
				seriesSummarry.current?.scrollHeight >
					seriesSummarry.current?.clientHeight
			);
		};
		handleResize();
		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
			const footer = document.querySelector(".footer");
			footer.style = null;
		};
	}, [series, user, onMobile, infoToShow]);

	const printArray = (list) => {
		const listCount = list.length;

		if (listCount === 1) {
			return list[0];
		} else if (listCount === 2) {
			return `${list[0]} e ${list[1]}`;
		} else {
			const allButLast = list.slice(0, -1).join(", ");
			return `${allButLast}, e ${list[listCount - 1]}`;
		}
	};

	const getCompletionPercentage = () => {
		const indexOfSeries = user.userList.findIndex((seriesObj) => {
			return seriesObj.Series._id.toString() === id;
		});
		if (indexOfSeries !== -1) {
			return user.userList[indexOfSeries].completionPercentage;
		}
		return 0;
	};

	const checkOwnedVolumes = (id) => {
		if (user) {
			return user.ownedVolumes.includes(id);
		}
		return false;
	};

	const customWindowConfirm = (message, onConfirmCb, onCancelCb) => {
		setOnConfirm(() => onConfirmCb);
		setOnCancel(() => onCancelCb);
		setConfirmationMessage(message);
		setShowConfirmation(true);
	};

	const addOrRemoveSeries = async (isAdding) => {
		try {
			const url = isAdding
				? `${process.env.REACT_APP_HOST_ORIGIN}/user/add-series`
				: `${process.env.REACT_APP_HOST_ORIGIN}/user/remove-series`;

			const response = await axios({
				method: "POST",
				data: { id },
				withCredentials: true,
				url: url,
			});
			setOutdated(true);
		} catch (err) {
			console.log(err);
		}
	};

	const handleChange = (e, id) => {
		const adding = e.target.checked;

		if (adding) {
			//Lista do que precisa ser adicionado
			const index = localVolumeState.findIndex(
				(volumeState) => volumeState.volumeId === id
			);
			const listToAdd = localVolumeState
				.slice(0, index + 1)
				.filter((volume) => volume.ownsVolume === false)
				.map((volume) => {
					return volume.volumeId;
				});

			if (listToAdd.length > 1) {
				customWindowConfirm(
					"Deseja adicionar os volumes anteriores também?",
					() => {
						addOrRemoveVolume(adding, listToAdd);

						return;
					},
					() => {
						addOrRemoveVolume(adding, [id]);
					}
				);
			} else {
				addOrRemoveVolume(adding, [id]);
			}
		} else {
			addOrRemoveVolume(adding, [id]);
		}

		const newList = localVolumeState.map((checkbox) => {
			const { volumeId, ownsVolume } = checkbox;
			if (volumeId === id) {
				return { ...checkbox, ownsVolume: !ownsVolume };
			}
			return checkbox;
		});
		setLocalVolumeState(newList);
	};

	const handleSelectAll = (e) => {
		if (!user) {
			return;
		}
		const adding = e.target.checked;
		const list = localVolumeState
			.filter((volume) => volume.ownsVolume === !adding)
			.map((volume) => {
				return volume.volumeId;
			});
		if (!adding) {
			customWindowConfirm(
				"Deseja remover todos os volumes?",
				() => addOrRemoveVolume(adding, list),
				null
			);
		} else {
			addOrRemoveVolume(adding, list);
		}
	};

	const addOrRemoveVolume = async (isAdding, idList) => {
		try {
			const url = isAdding
				? `${process.env.REACT_APP_HOST_ORIGIN}/user/add-volume`
				: `${process.env.REACT_APP_HOST_ORIGIN}/user/remove-volume`;

			const amoutVolumesFromSeries = series.volumes.length;
			const response = await axios({
				method: "POST",
				data: { idList: idList, amoutVolumesFromSeries, seriesId: id },
				withCredentials: true,
				url: url,
			});
			setOutdated(true);
		} catch (err) {
			console.log(err);
		}
	};

	const handleRemoveSeries = () => {
		customWindowConfirm(
			"Remover essa coleção também irá remover todos os seus volumes deseja prosseguir?",
			() => addOrRemoveSeries(false),
			null
		);
	};
	const renderAddRemoveButton = () => {
		let inList = false
		if(user){
			const indexOfSeries = user.userList.findIndex((seriesObj) => {
				return seriesObj.Series._id.toString() === id;
			});
			inList = indexOfSeries !== -1;
		}
		return (
			<button
				className={`button button--grow button--${inList ? "red" : "green"}`}
				onClick={() => {
					if (!user) { return; }
					inList ? handleRemoveSeries() : addOrRemoveSeries(true);
				}}
			>
				{inList ? "Remover coleção" : "Adicionar coleção"}
			</button>
		);
	};

	const renderVolumeItem = (volume) => {
		const { volumeId, image, volumeNumber } = volume;
		const ownsVolume = localVolumeState
			? localVolumeState.find((element) => element.volumeId === volumeId)
					.ownsVolume
			: false;
		return (
			<li key={volumeId} className="series__volume-item">
				<Link
					to={`/volume/${volumeId}`}
					className="series__volume__image-wrapper"
				>
					<img
						src={image}
						alt={`cover volume ${volumeNumber}`}
						className="series__volume__image"
					/>
				</Link>
				{onMobile && (
					<Link to={`/volume/${volumeId}`} className="series__volume__number">
						<strong>Volume {volumeNumber}</strong>
					</Link>
				)}
				<div className="series__volume__checkmark-container">
					<label
						htmlFor={`have-volume-check-mark-${volumeId}`}
						className={onMobile ? "checkmark-label" : null}
					>
						<strong>Volume {volumeNumber}</strong>
					</label>
					<input
						type="checkbox"
						name={`have-volume-check-mark-${volumeId}`}
						id={`have-volume-check-mark-${volumeId}`}
						className="checkmark"
						disabled={user ? false : true}
						checked={ownsVolume}
						onChange={(e) => {
							handleChange(e, volumeId);
						}}
					/>
				</div>
			</li>
		);
	};

	const {
		seriesCover,
		title,
		publisher,
		authors,
		volumes,
		dimmensions,
		summary,
		genres,
	} = series;

	return (
		<div className="series container page-content">
			{showConfirmation && (
				<PromptConfirm
					message={confirmationMessage}
					onConfirm={onConfirm}
					onCancel={onCancel}
					hidePrompt={setShowConfirmation}
				></PromptConfirm>
			)}

			<div className="series__main-container">
				<div className="series__image-wrapper">
					<img
						src={seriesCover}
						alt={`cover volume ${title}`}
						className="series__cover"
						ref={seriesCoverImage}
					/>
					<div className="series_main-info" ref={mainInfo}>
						{
							<div className="series__butons-containers">
								<label htmlFor="select-all-check-mark" className="button">
									<strong>
										{user && getCompletionPercentage() === 1
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
											user && getCompletionPercentage() === 1 ? true : false
										}
										onChange={(e) => handleSelectAll(e)}
									/>
								</label>
								{renderAddRemoveButton()}
							</div>
						}
						{onMobile && <h1 className="series__title">{title}</h1>}
						<div className="series__mobile-options-container">
							<div
								className={`series__mobile-options series__mobile-options--${
									infoToShow === "details" && "selected"
								}`}
								onClick={() => {
									setInfoToShow("details");
								}}
							>
								Details
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
				{(infoToShow === "details" || !onMobile) && (
					<ul
						className="series__details-container series__content"
						style={{ top: contentTopValue }}
					>
						{!onMobile && (
							<li>
								<h1 className="series__title">{title}</h1>
							</li>
						)}
						{publisher && (
							<li className="series__details">
								<strong>Editora:</strong> {publisher}
							</li>
						)}
						{authors && (
							<li className="series__details">
								<strong>Autores:</strong> {printArray(authors)}
							</li>
						)}
						{dimmensions && (
							<li className="series__details">
								<strong>Formato:</strong> {dimmensions?.join("cm x ") + "cm"}
							</li>
						)}

						{genres && (
							<li className="series__details">
								<strong>Generos:</strong> {printArray(genres)}
							</li>
						)}
						{summary && (
							<li className="series__details" style={{ paddingBottom: "0px" }}>
								<strong>Sinopse:</strong>
								<p
									ref={seriesSummarry}
									className="series__summary"
									style={{ display: showingMore ? "block" : null }}
								>
									{summary.map((paragraph) => {
										return (
											<>
												{paragraph}
												<br />
											</>
										);
									})}
								</p>
								{needShowButton && !showingMore && (
									<div
										className="series__show-more"
										onClick={() => {
											setShowingMore(true);
										}}
									>
										Mostrar mais
									</div>
								)}
							</li>
						)}
					</ul>
				)}
			</div>
			{(infoToShow === "volumes" || !onMobile) && (
				<ol
					className="series__volumes-container series__content"
					style={{ top: contentTopValue }}
				>
					{volumes.map((volume) => renderVolumeItem(volume))}
				</ol>
			)}
		</div>
	);
}
