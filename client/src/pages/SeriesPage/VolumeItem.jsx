import { Link } from "react-router-dom";

export default function VolumeItem({
	volumeInfo,
	localVolumeState,
	handleChange,
	user,
}) {
	const { volumeId, image, volumeNumber } = volumeInfo;
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
			<Link to={`/volume/${volumeId}`} className="series__volume__number">
				<strong>Volume {volumeNumber}</strong>
			</Link>
			<div className="series__volume__checkmark-container">
				<label htmlFor={`have-volume-check-mark-${volumeId}`}>
					<strong className="checkmark-label">
						Volume {volumeNumber}
					</strong>
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
				</label>
			</div>
		</li>
	);
}
