import { useContext, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { UserContext } from "../../contexts/userProvider";
import axios from "axios";
import { getOwnedVolumeInfo } from "../../utils/seriesDataFunctions";
import { useEditVolume } from "../../contexts/EditVolumeContext";
import { messageContext } from "../../contexts/messageStateProvider";
import ContentHeader from "../../components/contentHeader/contentHeader";
import RatingWidget from "../../components/contentHeader/RatingWidget";
import RateButton from "../../components/contentHeader/RateButton";

export default function VolumeHeader({ volumeData, rating }) {
	const { id } = useParams();
	const navigate = useNavigate();
	const { openEditModal } = useEditVolume();
	const { addMessage } = useContext(messageContext);
	const { user, setOutdated } = useContext(UserContext);

	const checkOwnedVolume = () => {
		return user?.ownedVolumes
			? user.ownedVolumes.some(
					(entry) => entry.volume.toString() === id.toString(),
				)
			: false;
	};

	const addOrRemoveVolume = async (isAdding) => {
		try {
			if (!volumeData) return;
			const url = isAdding
				? `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/add-volume`
				: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/remove-volume`;

			await axios({
				method: "POST",
				data: {
					idList: [id],
					seriesId: volumeData.serie.id,
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
					ownedVolumeData._id = id;
					openEditModal(ownedVolumeData);
				} else {
					addMessage("Precisa adicionar esse volume primeiro");
				}
			},
		},
	];
	const navLinks = useMemo(
		() => [
			{ to: `/volume/${id}`, label: "Geral", end: true },
			{ to: `/volume/${id}/comments`, label: "Comentários" },
		],
		[id],
	);
	const mainAction = {
		label: checkOwnedVolume() ? "Remover volume" : "Adicionar Volume",
		isRed: user && checkOwnedVolume(),
		onClick: handleChange,
	};

	return (
		<ContentHeader
			data={volumeData}
			imageFilename={volumeData?.image}
			backgroundImageUrl={`${
				import.meta.env.REACT_APP_HOST_ORIGIN
			}/images/medium/${volumeData?.image}`}
			title={volumeData?.serie?.title}
			subtitle={`Volume ${volumeData?.number}`}
			authors={volumeData?.serie?.authors}
			genres={volumeData?.serie?.genres}
			isAdult={volumeData?.serie?.isAdult}
			summary={volumeData?.summary}
			actions={{ mainAction, dropdownOptions, isDisabled: !user }}
			navLinks={navLinks}
			ratingWidget={
				volumeData?.serie?._id ? (
					<RatingWidget
						ratingAverage={rating.average}
						ratingCount={rating.count}
					/>
				) : null
			}
			ratingButton={
				volumeData?.serie?._id ? (
					<RateButton
						myScore={rating.myScore}
						isDerived={rating.isDerived}
						loading={rating.loading}
						onSubmit={rating.submit}
						onRemove={rating.remove}
					/>
				) : null
			}
		/>
	);
}
