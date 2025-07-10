import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./SeriesPage.css";
import { UserContext } from "../../components/userProvider";
import axios from "axios";
import PromptConfirm from "../../components/PromptConfirm";
import SeriesInfoCard from "./SeriesInfoCard";
import SeriesVolumesList from "./SeriesVolumesList";
import { checkOwnedVolumes, customWindowConfirm } from "./utils";
import SkeletonPage from "../../components/SkeletonPage";
import SkeletonVolumesList from "./SkeletonVolumesList";

export default function SeriesPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { user, setOutdated, isFetching } = useContext(UserContext);
	const [series, setSeries] = useState();
	const [localVolumeState, setLocalVolumeState] = useState();
	const [infoToShow, setInfoToShow] = useState("details");
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [confirmationMessage, setConfirmationMessage] = useState("");
	const [onConfirm, setOnConfirm] = useState(null);
	const [onCancel, setOnCancel] = useState(null);

	useEffect(() => {
		if (!isFetching && !user?.allowAdult && series?.isAdult) {
			navigate("/");
		}
	}, [isFetching, user, navigate, series]);

	const setters = [
		setOnConfirm,
		setOnCancel,
		setConfirmationMessage,
		setShowConfirmation,
	];

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
		if (series?.title) {
			const newLocalVolumeState = series.volumes.map((volume) => {
				const { volumeId } = volume;
				const ownsVolume = checkOwnedVolumes(user, volumeId);
				return { volumeId, ownsVolume };
			});
			setLocalVolumeState(newLocalVolumeState);
		}
	}, [series, user]);

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
					setters,
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

	const addOrRemoveVolume = async (isAdding, idList) => {
		try {
			const url = isAdding
				? `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/add-volume`
				: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/remove-volume`;

			const amountVolumesFromSeries = series.volumes.length;
			await axios({
				method: "POST",
				data: { idList: idList, amountVolumesFromSeries, seriesId: id },
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

	return (
		<div className="container page-content">
			{showConfirmation && (
				<PromptConfirm
					message={confirmationMessage}
					onConfirm={onConfirm}
					onCancel={onCancel}
					hidePrompt={setShowConfirmation}
				></PromptConfirm>
			)}
			{series ? (
				<>
					<SeriesInfoCard
						seriesInfo={series}
						addOrRemoveVolume={addOrRemoveVolume}
						localVolumeList={localVolumeState}
						windowSetters={setters}
						infoToShow={infoToShow}
						setInfoToShow={setInfoToShow}
					></SeriesInfoCard>
					<SeriesVolumesList
						volumes={series.volumes}
						infoToShow={infoToShow}
						localVolumesList={localVolumeState}
						handleChange={handleChange}
					></SeriesVolumesList>
				</>
			) : (
				<>
					<SkeletonPage type="Series"></SkeletonPage>
					<div
						className={`series__volumes-container mobile-appearence ${
							infoToShow !== "volumes" ? "" : "mobile-appearence--show"
						}`}
					>
						<SkeletonVolumesList count={12}></SkeletonVolumesList>
					</div>
				</>
			)}
		</div>
	);
}
