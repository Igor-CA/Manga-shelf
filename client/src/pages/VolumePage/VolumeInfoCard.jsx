import { useContext, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { UserContext } from "../../components/userProvider";
import axios from "axios";

export default function VolumeInfoCard({ volumeData }) {
	const { id } = useParams();

	const { user, setOutdated } = useContext(UserContext);
	const [loaded, setLoaded] = useState(false);

	const handleLoading = () => {
		setLoaded(true);
	};
	const checkOwnedVolume = () => {
		if (user) {
			return user.ownedVolumes.includes(id);
		}
		return false;
	};

	const addOrRemoveVolume = async (isAdding) => {
		try {
			if (!volumeData) return;

			const url = isAdding
				? `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/add-volume`
				: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/remove-volume`;
			const amountVolumesFromSeries = volumeData.serie.volumes.length;
			await axios({
				method: "POST",
				data: {
					idList: [id],
					amountVolumesFromSeries,
					seriesId: volumeData.serie.id,
					seriesStatus: volumeData.serie.status
				},
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				withCredentials: true,
				url: url,
			});
			setOutdated(true);
		} catch (err) {
			console.log(err);
		}
	};

	const handleChange = (e) => {
		const adding = e.target.checked;
		addOrRemoveVolume(adding);
	};

	const { image, serie, number, defaultPrice, pagesNumber, summary, date } =
		volumeData;

	return (
		<div className="volume">
			<div className="volume__cover-wrapper">
				<div className="series-card__image-container">
					<img
						src={`${
							import.meta.env.REACT_APP_HOST_ORIGIN
						}/images/medium/${image}`}
						srcSet={`
							${import.meta.env.REACT_APP_HOST_ORIGIN}/images/small/${image} 100w,
							${import.meta.env.REACT_APP_HOST_ORIGIN}/images/medium/${image} 400w, 
							${import.meta.env.REACT_APP_HOST_ORIGIN}/images/large/${image} 700w,
							${import.meta.env.REACT_APP_HOST_ORIGIN}/images/extralarge/${image} 1000w,`}
						alt={`cover ${serie.title} volume ${number}`}
						loading="lazy"
						className={`series-card__img ${
							!loaded && "series-card__img--loading"
						}`}
						onLoad={handleLoading}
					/>
					{serie.isAdult && <div className="series-card__adult-indicator">+18</div>}
				</div>
				<div className="volume__main-info">
					<div className="volume__functions">
						<Link to={`/series/${serie.id}`} className="button">
							<strong>Ver coleção</strong>
						</Link>
						<label
							htmlFor="have-volume-check-mark"
							className={`button button--grow button--${
								user && checkOwnedVolume() ? "red" : "green"
							}`}
						>
							<strong>
								{user && checkOwnedVolume()
									? "Remover volume"
									: "Adicionar Volume"}
							</strong>
						</label>
						<input
							type="checkbox"
							name="have-volume-check-mark"
							id="have-volume-check-mark"
							className="checkmark invisible"
							disabled={user ? false : true}
							checked={user && checkOwnedVolume()}
							onChange={(e) => {
								handleChange(e);
							}}
						/>
					</div>
				</div>
			</div>
			<div className="volume__info-container">
				<h1 className="volume__title">
					{serie.title} Volume {number}
				</h1>
				<ul className="volume__details-container">
					{pagesNumber && (
						<li className="volume__details">
							<strong>Páginas:</strong> {pagesNumber}
						</li>
					)}
					{defaultPrice && (
						<li className="volume__details">
							<strong>Preço:</strong> R$ {defaultPrice}
						</li>
					)}
					{date && (
						<li className="volume__details">
							<strong>Data de lançamento:</strong> {date}
						</li>
					)}
					{summary && (
						<li className="volume__details">
							<strong>Sinopse:</strong>
							{summary.map((paragraph, index) => {
								return (
									<p className="volume__summary" key={index}>
										{paragraph}
									</p>
								);
							})}
						</li>
					)}
				</ul>
			</div>
		</div>
	);
}
