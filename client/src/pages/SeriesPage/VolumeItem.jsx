import { useContext, useState } from "react";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { Link } from "react-router-dom";
import { getOwnedVolumeInfo } from "./utils";
import { messageContext } from "../../components/messageStateProvider";
import axios from "axios";
import { UserContext } from "../../components/userProvider";

export default function VolumeItem({
	volumeInfo,
	localVolumeState,
	handleChange,
	user,
}) {
	const [loaded, setLoaded] = useState(false);
	const { volumeId, image, volumeNumber } = volumeInfo;
	const { addMessage, setMessageType } = useContext(messageContext);
	const { setOutdated } = useContext(UserContext);
	const ownsVolume =
		localVolumeState?.find((element) => element.volumeId === volumeId)
			?.ownsVolume ?? false;
	const handleCheckboxChange = (e) => {
		handleChange(e, volumeId);
	};
	const handleLoading = () => {
		setLoaded(true);
	};
	const toggleReadStatus = async (id) => {
		try {
			const result = await axios({
				method: "POST",
				data: {
					id: id,
				},
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/toggle-read`,
			});
			setOutdated(true);
			setMessageType("Success");
			addMessage(result.data.msg);
		} catch (err) {
			console.log(err);
			const customErrorMessage = err.response.data.msg;
			addMessage(customErrorMessage);
		}
	};
	const ownedVolumeData = getOwnedVolumeInfo(user, volumeId);
	return (
		<div key={volumeId} className="series__volume-item">
			<input
				type="checkbox"
				name={`have-volume-check-mark-${volumeId}`}
				id={`have-volume-check-mark-${volumeId}`}
				className="volume-state-controller"
				disabled={!user}
				checked={ownsVolume}
				onChange={handleCheckboxChange}
			/>
			<Link
				to={`/volume/${volumeId}`}
				className="series__volume__image-wrapper"
			>
				<img
					src={`${
						import.meta.env.REACT_APP_HOST_ORIGIN
					}/images/medium/${image}`}
					srcSet={`
						${import.meta.env.REACT_APP_HOST_ORIGIN}/images/small/${image} 100w,
						${import.meta.env.REACT_APP_HOST_ORIGIN}/images/medium/${image} 400w, 
						${import.meta.env.REACT_APP_HOST_ORIGIN}/images/large/${image} 700w,
						${import.meta.env.REACT_APP_HOST_ORIGIN}/images/extralarge/${image} 1000w,`}
					sizes=" (min-width: 1024px) 15vw,
							(min-width: 768px) 20vw, 
							(max-width: 768px) 20vw, "
					loading="lazy"
					alt={`cover volume ${volumeNumber}`}
					className={`series__volume__image ${
						!loaded && "series__volume__image--loading"
					}`}
					onLoad={handleLoading}
				/>
			</Link>
			<div className="series__volume__body">
				<strong className="checkmark-label">Volume {volumeNumber}</strong>

				<div className="actions-container">
					<label
						htmlFor={`have-volume-check-mark-${volumeId}`}
						className="action-label"
					>
						<span className="text-add">Adicionar</span>
						<span className="text-owned">Remover</span>
					</label>
					{ownedVolumeData && (
						<div
							className={`button ${ownedVolumeData?.isRead?"button--red":"button--green"}`}
							title={`Marcar volume como ${
								ownedVolumeData?.isRead ? "não " : ""
							}lido`}
							onClick={() => toggleReadStatus(volumeId)}
						>
							{ownedVolumeData?.isRead ? <IoMdEyeOff /> : <IoMdEye />}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
