import { useContext, useMemo } from "react";
import { UserContext } from "../../contexts/userProvider";
import {
	checkIfInWishlist,
	getCompletionPercentage,
	getSeriesStatus,
} from "../../utils/seriesDataFunctions";
import ContentHeader from "../../components/contentHeader/contentHeader";
import RatingWidget from "../../components/contentHeader/RatingWidget";
import RateButton from "../../components/contentHeader/RateButton";
import { useRating } from "../../utils/useRating";

export default function SeriesPageHeader({ seriesInfo, actions }) {
	const { user } = useContext(UserContext);
	const {
		handleSelectAllVolumes,
		toggleSeriesInList,
		toggleWishlist,
		toggleDrop,
	} = actions;

	const {
		seriesCover,
		title,
		summary,
		genres,
		authors,
		id,
		isAdult,
		ratingAverage,
		ratingCount,
		mySeriesScore,
		myVolumeScores,
	} = seriesInfo || {};

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

	const volumeScoreValues = myVolumeScores ? Object.values(myVolumeScores) : [];
	const derivedSeriesScore =
		volumeScoreValues.length > 0
			? Math.round(
					(volumeScoreValues.reduce((a, b) => a + b, 0) /
						volumeScoreValues.length) *
						10,
				) / 10
			: null;

	const rating = useRating({
		seriesId: id,
		volumeId: null,
		manualScore: mySeriesScore ?? null,
		derivedScore: derivedSeriesScore,
		average: ratingAverage ?? 0,
		count: ratingCount ?? 0,
	});

	const navLinks = useMemo(
		() => [
			{ to: `/series/${id}`, label: "Geral", end: true },
			{ to: `/series/${id}/volumes`, label: "Volumes" },
			{ to: `/series/${id}/related`, label: "Obras Relacionadas" },
			{ to: `/series/${id}/reviews`, label: "Reviews" },
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
			ratingWidget={
				id ? (
					<RatingWidget
						ratingAverage={rating.average}
						ratingCount={rating.count}
					/>
				) : null
			}
			ratingButton={
				id ? (
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
