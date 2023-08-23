import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./SeriesPage.css";
import { UserContext } from "../../components/userProvider";
import axios from "axios";

export default function SeriesPage() {
	const { id } = useParams();
	const [user, setUser] = useContext(UserContext);
	const [series, setSeries] = useState({
		title: "",
		publisher: "",
		seriesCover: "",
		authors: [],
		volumes: [],
	});
	const [localVolumeState, setLocalVolumeState] = useState();
	const [localUserListState, setLocalUserListState] = useState([]);

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
	}, [series]);

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

	const calculateCompletePorcentage = (newVolume) => {
		const correctionValue = newVolume ? -1 : 1;
		const total = localVolumeState.length;
		const ownedVolumes =
			localVolumeState.filter((volume) => volume.ownsVolume).length +
			correctionValue;
		return ownedVolumes / total;
	};

	const checkOwnedVolumes = (id) => {
		if (user) {
			return user.ownedVolumes.includes(id);
		}
		return false;
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
				console.log("Adding?");
				const newUserList = [...localUserListState];
				newUserList.push({ Series: { id } });
				setLocalUserListState([...newUserList]);
			} else {
				console.log("Rmoving");
				const newUserList = localUserListState.filter(
					(series) => series.Series.id !== id
				);
				setLocalUserListState([...newUserList]);
			}
			console.log(response);
		} catch (err) {
			console.log(err);
		}
	};

	const handleChange = (e, id) => {
		//updates user in database
		const previousValue = !e.target.checked;
		const completePorcentage = calculateCompletePorcentage(previousValue);
		previousValue
			? addOrRemoveVolume(false, id, completePorcentage)
			: addOrRemoveVolume(true, id, completePorcentage);

		//update the state of checklist
		const newList = localVolumeState.map((checkbox) => {
			const { volumeId, ownsVolume } = checkbox;
			if (volumeId === id) {
				return { ...checkbox, ownsVolume: !ownsVolume };
			}
			return checkbox;
		});
		setLocalVolumeState(newList);
	};

	const addOrRemoveVolume = async (isAdding, volumeId, completePorcentage) => {
		try {
			const url = isAdding
				? `${process.env.REACT_APP_HOST_ORIGIN}/user/add-volume`
				: `${process.env.REACT_APP_HOST_ORIGIN}/user/remove-volume`;

			const response = await axios({
				method: "POST",
				data: { _id: volumeId, completePorcentage, seriesId: id },
				withCredentials: true,
				url: url,
			});
			console.log(response);
		} catch (err) {
			console.log(err);
		}
	};

	const renderAddRemoveButton = () => {
		console.log(localUserListState);
		const inList = localUserListState.find((series) => series.Series.id === id);
		return (
			<button
				className="add-button"
				onClick={() => {
					inList ? addOrRemoveSeries(false) : addOrRemoveSeries(true);
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
				</div>
			</div>
			<ol className="series__volumes-container">
				{volumes.map((volume) => renderVolumeItem(volume))}
			</ol>
		</div>
	);
}
