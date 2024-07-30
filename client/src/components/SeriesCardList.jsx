import { useCallback, useEffect, useRef, useState } from "react";
import { SeriesCard } from "./SeriesCard";
import { SkeletonSeriesCard } from "./SkeletonSeriesCard";

export default function SeriesCardList({
	skeletonsCount,
	fetchFunction,
	functionArguments,
	errorComponent,
	itemType
}) {
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(false);
	const [reachedEnd, setReachedEnd] = useState(false);
	const [seriesList, setSeriesList] = useState([]);
	const [argsCopy, setArgsCopy] = useState(functionArguments || []);
	const [showErrorComponent, setShowErrorComponent] = useState(false);

	const observer = useRef();
	const lastSeriesElementRef = useCallback((node) => {
		if (observer.current) observer.current.disconnect();
		observer.current = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting) {
				setPage((prevPage) => prevPage + 1);
			}
		});
		if (node) observer.current.observe(node);
	}, []);

	const updatePage = async (targetPage, aditionalArguments) => {
		if (!loading && !reachedEnd) {
			setLoading(true);
			try {
				if (typeof fetchFunction !== "function") return;
				const resultList = await fetchFunction(
					targetPage,
					...aditionalArguments
				);
				if (resultList.length > 0) {
					setSeriesList((previousList) =>
						targetPage === 1
							? [...resultList]
							: [...previousList, ...resultList]
					);
					if(resultList.length < skeletonsCount ){
						setReachedEnd(true)
					}
					setShowErrorComponent(false);
				} else {
					if (page === 1) {
						setSeriesList([]);
						setShowErrorComponent(true);
					}
					setReachedEnd(true);
				}
			} catch (error) {
				console.error("Error fetching user Data:", error);
			} finally {
				setLoading(false);
			}
		}
	};

	useEffect(() => {
		const resetPage = () => {
			setPage(1);
			setSeriesList([]);
			setReachedEnd(false);
			setArgsCopy(functionArguments || []);
		};
		resetPage();
	}, [functionArguments]);
	useEffect(() => {
		updatePage(page, argsCopy);
	}, [page, argsCopy]);

	return (
		<div className="collection-container">
			{seriesList.length > 0 &&
				seriesList.map((series, index) => {
					return (
						<div
							key={series._id}
							ref={
								index === seriesList.length - 1
									? lastSeriesElementRef
									: undefined
							}
						>
							<SeriesCard itemDetails={series} itemType={itemType || "Series"}></SeriesCard>
						</div>
					);
				})}
			{loading &&
				Array(skeletonsCount)
					.fill()
					.map((_, id) => {
						return <SkeletonSeriesCard key={id}></SkeletonSeriesCard>;
					})}
			{showErrorComponent && errorComponent()}
		</div>
	);
}
