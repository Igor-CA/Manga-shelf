import { useContext, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { UserContext } from "../../components/userProvider";
import axios from "axios";
import SkeletonHeader from "../../components/SkeletonPage";

import "../SeriesPage/SeriesPage.css";
import ActionDropdown from "../SeriesPage/ActionsDropdown";
import { getOwnedVolumeInfo, printArray } from "../SeriesPage/utils";
import { useEditVolume } from "../../components/EditVolumeContext";
import { messageContext } from "../../components/messageStateProvider";
export default function VolumeInfoCard({ volumeData }) {
	const { id } = useParams();
	const seriesSummarry = useRef(null);
	const [showingMore, setShowingMore] = useState(false);
	const navigate = useNavigate();
	const { openEditModal } = useEditVolume();
	const { addMessage } = useContext(messageContext);

	const { user, setOutdated } = useContext(UserContext);
	const [loaded, setLoaded] = useState(false);

	const handleLoading = () => {
		setLoaded(true);
	};
	const checkOwnedVolume = () => {
		return user?.ownedVolumes
			? user.ownedVolumes.some(
					(entry) => entry.volume.toString() === id.toString()
			  )
			: false;
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
					seriesStatus: volumeData.serie.status,
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

	const handleChange = () => {
		const adding = !checkOwnedVolume();
		addOrRemoveVolume(adding);
	};

	const dropdownOptions = [
		{
			label: "Ver coleção",
			checked: user,
			onChange: () => {
				navigate(`/series/${volumeData.serie?.id}`);
			},
		},
		{
			label: "Editar informações do seu volume",
			checked: true,
			onChange: () => {
				const ownedVolumeData = getOwnedVolumeInfo(user, id);
				if (ownedVolumeData) {
					openEditModal(ownedVolumeData);
				} else {
					addMessage("Precisa adicionar esse volume primeiro");
				}
			},
		},
	];

	const mainAction = {
		label: checkOwnedVolume() ? "Remover volume" : "Adicionar Volume",
		isRed: user && checkOwnedVolume(),
		onClick: handleChange,
	};
	return volumeData ? (
		<header className="content-header">
			<div className="header__bg-image-container">
				<div
					style={{
						backgroundImage: `url('${
							import.meta.env.REACT_APP_HOST_ORIGIN
						}/images/medium/${volumeData.image}')`,
					}}
					className="header__bg-image"
					role="img"
					aria-label="background-image"
				></div>
				<div className="banner-shade"></div>
			</div>
			<div className="container">
				<div className="header-container">
					<div className="header__art-container">
						<div className="header__cover-image-container">
							<img
								src={`${import.meta.env.REACT_APP_HOST_ORIGIN}/images/medium/${
									volumeData.image
								}`}
								srcSet={
									`${import.meta.env.REACT_APP_HOST_ORIGIN}/images/small/${
										volumeData.image
									} 100w,` +
									`${import.meta.env.REACT_APP_HOST_ORIGIN}/images/medium/${
										volumeData.image
									} 400w,` +
									`${import.meta.env.REACT_APP_HOST_ORIGIN}/images/large/${
										volumeData.image
									} 700w,` +
									`${import.meta.env.REACT_APP_HOST_ORIGIN}/images/extralarge/${
										volumeData.image
									} 1000w,`
								}
								sizes=" (min-width: 768px) 360px, 
                                            (max-width: 768px) 100vw,"
								loading="lazy"
								alt={`cover ${volumeData.serie?.title} volume ${volumeData.number}`}
								className={`header__cover-image ${
									!loaded && "header__cover-image--loading"
								}`}
								onLoad={handleLoading}
							/>
							{volumeData?.serie?.isAdult && (
								<div className="series-card__adult-indicator">+18</div>
							)}
						</div>
						<ActionDropdown
							mainAction={mainAction}
							options={dropdownOptions}
							isDisabled={!user}
						/>
					</div>
					<div className="header__main-info-container">
						<div className="header__title-container">
							<div>
								<h1 className="content-title">{volumeData.serie?.title}</h1>
								<h2>Volume {volumeData.number}</h2>
							</div>
							{volumeData.serie?.authors?.length > 0 && (
								<span className="content-author">
									Obra de: {volumeData.serie?.authors && printArray(volumeData.serie?.authors)}
								</span>
							)}
						</div>
						<div className="header__secondary-info">
							<ul className="header__genres-list">
								{volumeData.serie?.genres.map((genre, index) => {
									return (
										<li className="header__genre-tag" key={index}>
											{genre}
										</li>
									);
								})}
							</ul>
						</div>
					</div>
				</div>

				{volumeData.summary?.length > 0 && (
					<div className="content__details-summary">
						<strong>Sinopse:</strong>
						<div
							ref={seriesSummarry}
							className={`content__summary ${
								showingMore ? "content__summary--show-full" : ""
							}`}
						>
							{volumeData.summary.map((paragraph, i) => (
								<p key={i}>{paragraph}</p>
							))}
						</div>
						{!showingMore && (
							<button
								className="show-more__button"
								aria-label="Mostrar mais"
								onClick={() => setShowingMore(true)}
							>
								Mostrar mais
							</button>
						)}
					</div>
				)}
			</div>
		</header>
	) : (
		<SkeletonHeader></SkeletonHeader>
	);
}
