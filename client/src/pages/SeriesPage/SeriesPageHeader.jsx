import { useContext, useMemo } from "react";
import { UserContext } from "../../contexts/userProvider";
import {
	checkIfInWishlist,
	getCompletionPercentage,
	getSeriesStatus,
} from "../../utils/seriesDataFunctions";
import ContentHeader from "../../components/contentHeader/contentHeader";

export default function SeriesPageHeader({ seriesInfo, actions }) {
	const { user } = useContext(UserContext);
	const {
		handleSelectAllVolumes,
		toggleSeriesInList,
		toggleWishlist,
		toggleDrop,
	} = actions;

	const { seriesCover, title, summary, genres, authors, id, isAdult } =
		seriesInfo || {};

	const isSeriesInUserList =
		user?.userList?.some(
			(seriesObj) =>
				seriesObj.Series._id.toString() === id || seriesObj.Series === id,
		) ?? false;

	const mainAction = {
		label: !isSeriesInUserList ? "Adicionar coleção" : "Remover coleção",
		isRed: isSeriesInUserList,
		onClick: () => toggleSeriesInList(!isSeriesInUserList),
	};

	const dropdownOptions = [
		{
			label:
				user && getCompletionPercentage(user, id) === 1
					? "Remover todos os volumes"
					: "Adicionar todos os volumes",
			checked: user && getCompletionPercentage(user, id) === 1,
			onChange: handleSelectAllVolumes,
		},
		{
			label:
				user && checkIfInWishlist(user, id)
					? "Remover da lista de desejos"
					: "Adicionar à lista de desejos",
			checked: user && checkIfInWishlist(user, id),
			onChange: toggleWishlist,
		},
		{
			label:
				user && getSeriesStatus(user, id) === "Dropped"
					? "Voltar a colecionar"
					: "Abandonar (droppar) coleção",
			checked: user && getSeriesStatus(user, id) === "Dropped",
			onChange: toggleDrop,
		},
	];

	const navLinks = useMemo(
		() => [
			{ to: `/series/${id}`, label: "Geral", end: true },
			{ to: `/series/${id}/volumes`, label: "Volumes" },
			{ to: `/series/${id}/related`, label: "Obras Relacionadas" },
			/*
			{ to: `/series/${id}/reviews`, label: "Reviews" },
			{ to: `/series/${id}/user-volumes`, label: "Seus volumes" }, //Conditioned rendered
			*/
		],
		[id],
	);

	return (
		<ContentHeader
			data={seriesInfo}
			imageFilename={seriesCover}
			backgroundImageUrl={`${
				import.meta.env.REACT_APP_HOST_ORIGIN
			}/images/medium/${seriesCover}`}
			title={title}
			authors={authors}
			genres={genres}
			isAdult={isAdult}
			summary={summary}
			actions={{ mainAction, dropdownOptions, isDisabled: !user }}
			navLinks={navLinks}
		/>
	);
}
