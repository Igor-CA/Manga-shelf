import { useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { UserContext } from "../../components/userProvider";
import axios from "axios";
import { getOwnedVolumeInfo } from "../SeriesPage/utils";
import { useEditVolume } from "../../components/EditVolumeContext";
import { messageContext } from "../../components/messageStateProvider";
import ContentHeader from "../../components/contentHeader/contentHeader";

export default function VolumeInfoCard({ volumeData }) {
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
			// navLinks={navLinks}
		/>
	);
}
