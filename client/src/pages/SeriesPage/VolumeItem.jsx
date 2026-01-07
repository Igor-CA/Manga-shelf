import { useState } from "react";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { Link } from "react-router-dom";
export default function VolumeItem({
	volumeInfo,
	localVolumeState,
	handleChange,
	handleReadToggle,
	user,
}) {
	const [loaded, setLoaded] = useState(false);
	const { volumeId, image, volumeNumber } = volumeInfo;

	const myState = localVolumeState?.find((el) => el.volumeId === volumeId);
	const ownsVolume = myState?.ownsVolume ?? false;
	const isRead = myState?.isRead ?? false;

	const handleCheckboxChange = (e) => {
		handleChange(e, volumeId);
	};
	const handleLoading = () => {
		setLoaded(true);
	};

	return (
		<div className="series__volume-item">
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
					alt={`Cover volume ${volumeNumber}`}
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

					{ownsVolume && (
						<div
							className={`button ${isRead ? "button--red" : "button--green"}`}
							title={`Marcar volume como ${isRead ? "não " : ""}lido`}
							onClick={() => handleReadToggle(volumeId)}
						>
							{isRead ? <IoMdEyeOff /> : <IoMdEye />}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
