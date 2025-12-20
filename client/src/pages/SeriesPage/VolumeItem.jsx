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

	const handleCheckboxChange = (e) => {
		handleChange(e, volumeId);
	};
	return (
		<div key={volumeId} className="series__volume-item">
			<input
				type="checkbox"
				name={`have-volume-check-mark-${volumeId}`}
				id={`have-volume-check-mark-${volumeId}`}
				className="volume-state-controller"
				disabled={!user}
				checked={Math.random() < 0.5}
				onChange={handleCheckboxChange}
			/>
			<div to={`/volume/${volumeId}`} className="series__volume__image-wrapper">
				<Link to={`/volume/${volumeId}`}>
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
						className="series__volume__image"
					/>
				</Link>
			</div>
			<div className="series__volume__body">
				<strong className="checkmark-label">Volume {volumeNumber}</strong>

				<label htmlFor={`have-volume-check-mark-${volumeId}`} className="action-label">
					<span className="text-add">Adicionar</span>
					<span className="text-owned">Remover</span>
				</label>
			</div>
		</div>
	);
}
