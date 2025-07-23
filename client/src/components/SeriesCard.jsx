import { useContext, useState } from "react";
import "./SeriesCard.css";
import { Link } from "react-router-dom";
import { FaMinus, FaPlus } from "react-icons/fa";

import { FaRegBookmark } from "react-icons/fa6";
import { UserContext } from "./userProvider";
import axios from "axios";
import { messageContext } from "./messageStateProvider";
export function SeriesCard({ itemDetails, itemType, showActions = false }) {
	const [loaded, setLoaded] = useState(false);
	const [inUserList, setInUserList] = useState(itemDetails.inUserList);
	const [inWishlist, setInWishlist] = useState(itemDetails.inWishlist);
	const { addMessage, setMessageType } = useContext(messageContext);
	const { user, setOutdated } = useContext(UserContext);
	const {
		title,
		image,
		_id,
		completionPercentage,
		volumeNumber,
		isAdult,
		status,
		seriesSize,
		seriesStatus,
		seriesId,
	} = itemDetails;
	const link = itemType === "Series" ? `/series/${_id}` : `/volume/${_id}`;
	const imageText =
		itemType === "Series" ? title : `${title} - ${volumeNumber}`;

	const handleLoading = () => {
		setLoaded(true);
	};
	const handleAddRemove = (e) => {
		e.preventDefault();
		itemType === "Series"
			? addOrRemoveSeries(!inUserList)
			: addOrRemoveVolume(!inUserList, _id);
	};
	const handleAddRemoveFromWishlist = (e) => {
		e.preventDefault();
		addOrRemoveFromWishList(!inWishlist);
	};

	const addOrRemoveSeries = async (isAdding) => {
		try {
			setInUserList(isAdding);
			if (isAdding && inWishlist) {
				setInWishlist(false);
			}
			const url = isAdding
				? `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/add-series`
				: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/remove-series`;

			await axios({
				method: "POST",
				data: { id: _id },
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				url: url,
			});
			setMessageType("Success");
			addMessage(`Obra ${isAdding ? "adicionada" : "removida"} com sucesso`);
			setOutdated(true);
		} catch (err) {
			setInUserList(!isAdding);
			if (isAdding && inWishlist) {
				setInWishlist(true);
			}
			const customErrorMessage = err.response.data.msg;
			addMessage(customErrorMessage);
		}
	};

	const addOrRemoveFromWishList = async (isAdding) => {
		try {
			setInWishlist(isAdding);
			if (isAdding && inUserList) {
				setInUserList(false);
			}
			const url = isAdding
				? `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/add-to-wishlist`
				: `${
						import.meta.env.REACT_APP_HOST_ORIGIN
				  }/api/user/remove-from-wishlist`;

			await axios({
				method: "POST",
				data: { id: _id },
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				url: url,
			});
			setOutdated(true);
			setMessageType("Success");
			addMessage(
				`Obra ${
					isAdding
						? "adicionada à lista de desejos"
						: "removida da lista de desejos"
				} com sucesso`
			);
		} catch (err) {
			setInWishlist(!isAdding);
			if (isAdding && inUserList) {
				setInUserList(true);
			}
			const customErrorMessage = err.response.data.msg;
			addMessage(customErrorMessage);
		}
	};
	const addOrRemoveVolume = async (isAdding, id) => {
		try {
			setInUserList(isAdding);
			const url = isAdding
				? `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/add-volume`
				: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/remove-volume`;

			const amountVolumesFromSeries = seriesSize;
			await axios({
				method: "POST",
				data: {
					idList: [id],
					amountVolumesFromSeries,
					seriesId: seriesId,
					seriesStatus: seriesStatus,
				},
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				url: url,
			});
			setOutdated(true);
			setMessageType("Success");
			addMessage(
				`Volume ${
					isAdding
						? "adicionado"
						: "removido"
				} com sucesso`
			);
		} catch (err) {
			setInUserList(!isAdding);
			const customErrorMessage = err.response.data.msg;
			addMessage(customErrorMessage);
		}
	};
	return (
		<div className="series-card">
			<Link to={link} className="series-card__image-container">
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
							(min-width: 360px) and (max-width: 768px) 35vw, 
							(max-width: 320px) 50vw"
					loading="lazy"
					alt={`cover of ${title}`}
					className={`series-card__img ${
						!loaded && "series-card__img--loading"
					}`}
					onLoad={handleLoading}
				/>
				{isAdult && <div className="series-card__adult-indicator">+18</div>}
				{completionPercentage > 0 && status !== "Dropped" && (
					<div className="series-card__bar">
						<div
							className={`series-card__progress-bar  ${
								completionPercentage === 1
									? "series-card__progress-bar--completed"
									: null
							}`}
							style={{ width: `${completionPercentage * 100}%` }}
						></div>
					</div>
				)}
				{status === "Dropped" && (
					<div className="series-card__bar">
						<div
							className="series-card__progress-bar series-card__progress-bar--dropped "
							style={{ width: "100%" }}
						></div>
					</div>
				)}
				{showActions && user &&(
					<div className="series-card__actions-container">
						{itemType === "Series" && (
							<div
								title={`${
									inWishlist ? "Remover da" : "Adicionar à"
								} lista de desejos`}
								onClick={handleAddRemoveFromWishlist}
								className="series-card__button-container"
							>
								{!inWishlist ? (
									<FaRegBookmark className="series-card__button" />
								) : (
									<FaMinus className="series-card__button" />
								)}
							</div>
						)}
						<div
							title={`${inUserList ? "Remover da" : "Adicionar à"} coleção`}
							onClick={handleAddRemove}
							className="series-card__button-container"
						>
							{!inUserList ? (
								<FaPlus className="series-card__button" />
							) : (
								<FaMinus className="series-card__button" />
							)}
						</div>
					</div>
				)}
			</Link>
			<p className="series-card__title">{imageText}</p>
		</div>
	);
}
