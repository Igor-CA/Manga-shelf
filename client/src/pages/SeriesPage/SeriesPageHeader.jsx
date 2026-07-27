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
import { useAuthGate } from "../../utils/useAuthGate";

export default function SeriesPageHeader({ seriesInfo, actions, rating }) {
	const { user } = useContext(UserContext);
	const ensureLogged = useAuthGate();
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
	} = seriesInfo || {};

	const isSeriesInUserList =
		user?.userList?.some(
			(seriesObj) =>
				seriesObj.Series._id.toString() === id || seriesObj.Series === id,
		) ?? false;

	const mainAction = {
		label: !isSeriesInUserList ? "Adicionar coleção" : "Remover coleção",
		isRed: isSeriesInUserList,
		onClick: () =>
			ensureLogged(
				isSeriesInUserList
					? "remover essa obra da coleção"
					: "adicionar essa obra à coleção",
				() => toggleSeriesInList(!isSeriesInUserList),
			),
	};

	const dropdownOptions = [
		{
			label:
				user && getCompletionPercentage(user, id) === 1
					? "Remover todos os volumes"
					: "Adicionar todos os volumes",
			checked: user && getCompletionPercentage(user, id) === 1,
			onChange: (checked) =>
				ensureLogged(
					checked ? "adicionar todos os volumes" : "remover todos os volumes",
					() => handleSelectAllVolumes(checked),
				),
		},
		{
			label:
				user && checkIfInWishlist(user, id)
					? "Remover da lista de desejos"
					: "Adicionar à lista de desejos",
			checked: user && checkIfInWishlist(user, id),
			onChange: (checked) =>
				ensureLogged(
					checked
						? "adicionar essa obra à lista de desejos"
						: "remover essa obra da lista de desejos",
					() => toggleWishlist(checked),
				),
		},
		{
			label:
				user && getSeriesStatus(user, id) === "Dropped"
					? "Voltar a colecionar"
					: "Abandonar (droppar) coleção",
			checked: user && getSeriesStatus(user, id) === "Dropped",
			onChange: (checked) =>
				ensureLogged(
					checked
						? "abandonar essa coleção"
						: "voltar a colecionar essa obra",
					() => toggleDrop(checked),
				),
		},
	];

	const navLinks = useMemo(
		() => [
			{ to: `/series/${id}`, label: "Geral", end: true },
			{ to: `/series/${id}/volumes`, label: "Volumes" },
			{ to: `/series/${id}/related`, label: "Obras Relacionadas" },
			{ to: `/series/${id}/comments`, label: "Comentários" },
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
			actions={{ mainAction, dropdownOptions }}
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
