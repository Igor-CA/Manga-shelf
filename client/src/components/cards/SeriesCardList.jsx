import { useCallback, useEffect, useRef, useState } from "react";
import { SeriesCard } from "./SeriesCard";
import { SkeletonSeriesCard } from "./SkeletonSeriesCard";
import useListScrollRestoration from "../../utils/useListScrollRestoration";

export default function SeriesCardList({
	skeletonsCount,
	fetchFunction,
	functionArguments,
	errorComponent,
	itemType,
	showActions = false,
	cacheKey,
}) {
	const { initial, persist, cancelRestore } = useListScrollRestoration(cacheKey);

	const [page, setPage] = useState(() => (initial ? initial.page : 1));
	const [loading, setLoading] = useState(false);
	const [reachedEnd, setReachedEnd] = useState(() => (initial ? initial.reachedEnd : false));
	const [seriesList, setSeriesList] = useState(() => (initial ? initial.items : []));
	const [argsCopy, setArgsCopy] = useState(functionArguments || []);
	const [showErrorComponent, setShowErrorComponent] = useState(false);

	const observer = useRef();
	const offsetRef = useRef(initial ? initial.offset : 0);

	// The page our state was seeded for, so the fetch effect below doesn't immediately
	// re-fetch a page we already have. Compared by value (not consumed as a flag) so it stays
	// correct across StrictMode's double-invoke.
	const hydratedPageRef = useRef(initial ? initial.page : null);

	const lastProcessedKeyRef = useRef(cacheKey);

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
				const modifiedArgs = [...aditionalArguments];

				if (modifiedArgs.length === 0) {
					modifiedArgs.push({ offset: offsetRef.current });
				} else if (typeof modifiedArgs[0] === "object") {
					modifiedArgs[0] = { ...modifiedArgs[0], offset: offsetRef.current };
				}
				const resultList = await fetchFunction(targetPage, ...modifiedArgs);
				if (resultList.length > 0) {
					setSeriesList((previousList) =>
						targetPage === 1
							? [...resultList]
							: [...previousList, ...resultList],
					);
					if (resultList.length < skeletonsCount) {
						setReachedEnd(true);
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

	// Reset to a fresh page-1 load when the filters change. When this list opts into
	// restoration the reset is additionally guarded by value, so a re-run for the same key is
	// a no-op and can't wipe freshly hydrated state on mount. The `cacheKey &&` is essential:
	// without it, a list that does NOT opt in has `cacheKey === undefined` on both sides, the
	// guard is always true, and the reset never runs — which silently breaks its filters,
	// because `argsCopy` never updates and the fetch effect never re-runs.
	useEffect(() => {
		if (cacheKey && lastProcessedKeyRef.current === cacheKey) return;
		lastProcessedKeyRef.current = cacheKey;
		cancelRestore();
		hydratedPageRef.current = null;
		offsetRef.current = 0;
		setPage(1);
		setSeriesList([]);
		setReachedEnd(false);
		setArgsCopy(functionArguments || []);
	}, [functionArguments, cacheKey, cancelRestore]);

	useEffect(() => {
		if (hydratedPageRef.current != null && page === hydratedPageRef.current) return;
		updatePage(page, argsCopy);
	}, [page, argsCopy]);

	// Keep the stored snapshot current. In the effect BODY, never a cleanup — StrictMode
	// fires cleanups on mount, which would snapshot transient state.
	useEffect(() => {
		persist({ items: seriesList, page, reachedEnd, offset: offsetRef.current });
	}, [persist, seriesList, page, reachedEnd]);

	const handleStatusChange = (offset = 1) => {
		offsetRef.current += offset;
	};

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
							<SeriesCard
								itemDetails={series}
								itemType={itemType || "Series"}
								showActions={showActions}
								onStatusChange={handleStatusChange}
							></SeriesCard>
						</div>
					);
				})}
			{loading &&
				Array(skeletonsCount)
					.fill()
					.map((_, id) => {
						return <SkeletonSeriesCard key={id}></SkeletonSeriesCard>;
					})}
			{showErrorComponent && !loading && errorComponent()}
		</div>
	);
}
