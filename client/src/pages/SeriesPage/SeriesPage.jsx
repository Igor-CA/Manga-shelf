import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./SeriesPage.css";
import { UserContext } from "../../components/userProvider";
import axios from "axios";
import PromptConfirm from "../../components/PromptConfirm";

export default function SeriesPage() {
	const { id } = useParams();
	const { user, setOutdated } = useContext(UserContext);
	const [series, setSeries] = useState({
		title: "",
		publisher: "",
		seriesCover: "",
		authors: [],
		volumes: [],
	});
	const [localVolumeState, setLocalVolumeState] = useState();
	const [localUserListState, setLocalUserListState] = useState([]);
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [confirmationMessage, setConfirmationMessage] = useState("");
	const [onConfirm, setOnConfirm] = useState(null);
	const [onCancel, setOnCancel] = useState(null);

	useEffect(() => {
		const fetchSeriesData = async () => {
			try {
				const response = await axios.get(
					`${process.env.REACT_APP_HOST_ORIGIN}/api/series/${id}`
				);
				console.log(response);
				const responseData = response.data;
				setSeries(responseData);
			} catch (error) {
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
			if (user) setLocalUserListState([...user.userList]);
		}
	}, [series, user]);

	const getAuthorsString = (authors) => {
		const authorsCount = authors.length;

		if (authorsCount === 1) {
			return authors[0];
		} else if (authorsCount === 2) {
			return `${authors[0]} e ${authors[1]}`;
		} else {
			const allButLast = authors.slice(0, -1).join(", ");
			return `${allButLast}, e ${authors[authorsCount - 1]}`;
		}
	};

	const calculateCompletePorcentage = (isAdding, quantity = 1) => {
		if(localVolumeState){
			const removing = -1;
			const correctionValue = isAdding ? quantity : removing;
			const total = localVolumeState.length;
			const ownedVolumes =
				localVolumeState.filter((volume) => volume.ownsVolume).length +
				correctionValue;
			return ownedVolumes / total;
		}
		return 0
	};

	const checkOwnedVolumes = (id) => {
		if (user) {
			return user.ownedVolumes.includes(id);
		}
		return false;
	};

	const customWindowConfirm = (message, onConfirmCb, onCancelCb) => {
		console.log({ onConfirmCb, onCancelCb });
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
			if (isAdding) {
				const newUserList = [...localUserListState];
				newUserList.push({ Series: { id } });
				setLocalUserListState([...newUserList]);
			} else {
				const newUserList = localUserListState.filter(
					(series) => series.Series.id !== id
				);
				setLocalUserListState([...newUserList]);
			}
			setOutdated(true);
			//console.log(response);
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
					"Do you want to mark all previous volumes too?",
					() => {
						const completePorcentage = calculateCompletePorcentage(
							adding,
							listToAdd.length
						);

						addOrRemoveVolume(adding, listToAdd, completePorcentage);

						return;
					},
					() => {
						const completePorcentage = calculateCompletePorcentage(adding, 1);
						addOrRemoveVolume(adding, [id], completePorcentage);
					}
				);
			} else {
				const completePorcentage = calculateCompletePorcentage(adding, 1);
				addOrRemoveVolume(adding, [id], completePorcentage);
			}
		} else {
			const completePorcentage = calculateCompletePorcentage(adding);
			addOrRemoveVolume(adding, [id], completePorcentage);
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
		const adding = e.target.checked;
		const list = localVolumeState
				.filter((volume) => volume.ownsVolume === !adding)
				.map((volume) => {
					return volume.volumeId;
				});
		if(!adding){
			customWindowConfirm("Deseja remover todos os volumes?", 
				() => addOrRemoveVolume(adding, list, 0),
				null
			)
		}else{
			addOrRemoveVolume(adding, list, 1)
		}
	}

	const addOrRemoveVolume = async (isAdding, idList, completePorcentage) => {
		try {
			const url = isAdding
				? `${process.env.REACT_APP_HOST_ORIGIN}/user/add-volume`
				: `${process.env.REACT_APP_HOST_ORIGIN}/user/remove-volume`;

			const response = await axios({
				method: "POST",
				data: { idList: idList, completePorcentage, seriesId: id },
				withCredentials: true,
				url: url,
			});
			setOutdated(true);
			//console.log("RESPONSE:", response);
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
		//console.log(localUserListState);
		const inList = localUserListState.find((series) => series.Series.id === id);
		return (
			<button
				className="add-button"
				onClick={() => {
					inList ? handleRemoveSeries() : addOrRemoveSeries(true);
				}}
			>
				{inList ? "Remove Series" : "Add Series"}
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
				<img
					src={image}
					alt={`cover volume ${volumeNumber}`}
					className="series__volume__image"
				/>
				<Link to={`../volume/${volumeId}`} className="series__volume__number">
					<strong>Volume {volumeNumber}</strong>
				</Link>
				<div>
					<label htmlFor="have-volume-check-mark" className="checkmark-label">
						Tem:
					</label>
					<input
						type="checkbox"
						name="have-volume-check-mark"
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

	const { seriesCover, title, publisher, authors, volumes } = series;

	return (
		<div className="series">
			{showConfirmation && (
				<PromptConfirm
					message={confirmationMessage}
					onConfirm={onConfirm}
					onCancel={onCancel}
					hidePrompt={setShowConfirmation}
				></PromptConfirm>
			)}
			<div className="series__info-container">
				<img
					src={seriesCover}
					alt={`cover volume ${title}`}
					className="series__cover"
				/>
				<div className="series_details-container">
					<h1 className="series__details">{title}</h1>
					<p className="series__details">
						<strong>Editora:</strong> {publisher}
					</p>
					<p className="series__details">
						<strong>Autores:</strong> {getAuthorsString(authors)}
					</p>
					{user && renderAddRemoveButton()}
					<label htmlFor="have-volume-check-mark">
						<strong>Select all:</strong>
						<input
							type="checkbox"
							name="select-all-check-mark"
							className="checkmark"
							disabled={user ? false : true}
							checked={
								user && calculateCompletePorcentage(true, 0) === 1?true:false
							}
							onChange={(e) => handleSelectAll(e)}
						/>
					</label>
				</div>
			</div>
			<ol className="series__volumes-container">
				{volumes.map((volume) => renderVolumeItem(volume))}
			</ol>
		</div>
	);
}
