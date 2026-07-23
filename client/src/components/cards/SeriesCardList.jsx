import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigationType } from "react-router-dom";
import { SeriesCard } from "./SeriesCard";
import { SkeletonSeriesCard } from "./SkeletonSeriesCard";
import * as listScrollCache from "../../utils/listScrollCache";

export default function SeriesCardList({
	skeletonsCount,
	fetchFunction,
	functionArguments,
	errorComponent,
	itemType,
	showActions = false,
	cacheKey,
}) {
	const navigationType = useNavigationType();
	const initialSnapshotBoxRef = useRef();
	if (!initialSnapshotBoxRef.current) {
		initialSnapshotBoxRef.current = {
			snapshot:
				cacheKey && navigationType === "POP"
					? listScrollCache.get(cacheKey)
					: undefined,
		};
	}
	const initialSnapshot = initialSnapshotBoxRef.current.snapshot;

	const [page, setPage] = useState(() => (initialSnapshot ? initialSnapshot.page : 1));
	const [loading, setLoading] = useState(false);
	const [reachedEnd, setReachedEnd] = useState(() =>
		initialSnapshot ? initialSnapshot.reachedEnd : false,
	);
	const [seriesList, setSeriesList] = useState(() =>
		initialSnapshot ? initialSnapshot.items : [],
	);
	const [argsCopy, setArgsCopy] = useState(functionArguments || []);
	const [showErrorComponent, setShowErrorComponent] = useState(false);

	const observer = useRef();
	const offsetRef = useRef(initialSnapshot ? initialSnapshot.offset : 0);

	const hydratedPageRef = useRef(initialSnapshot ? initialSnapshot.page : null);
	const scrollYRef = useRef(0);
	const pendingRestoreScrollYRef = useRef(initialSnapshot ? initialSnapshot.scrollY : null);

	const restoreTargetRef = useRef(null);
	const restoreDeadlineRef = useRef(0);

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

	useEffect(() => {
		if (lastProcessedKeyRef.current === cacheKey) return;
		lastProcessedKeyRef.current = cacheKey;
		restoreTargetRef.current = null; 
		pendingRestoreScrollYRef.current = null;
		hydratedPageRef.current = null;
		offsetRef.current = 0;
		setPage(1);
		setSeriesList([]);
		setReachedEnd(false);
		setArgsCopy(functionArguments || []);
	}, [functionArguments, cacheKey]);

	useEffect(() => {
		if (hydratedPageRef.current != null && page === hydratedPageRef.current) return;
		updatePage(page, argsCopy);
	}, [page, argsCopy]);

	useLayoutEffect(() => {
		if (pendingRestoreScrollYRef.current == null) return;
		const targetScrollY = pendingRestoreScrollYRef.current;
		pendingRestoreScrollYRef.current = null;
		scrollYRef.current = targetScrollY;
		restoreTargetRef.current = targetScrollY;
		restoreDeadlineRef.current = performance.now() + 1500;
		window.scrollTo(0, targetScrollY);
	}, [seriesList]);

	useEffect(() => {
		if (!cacheKey) return undefined;

		let rafId = 0;
		const loop = () => {
			const target = restoreTargetRef.current;
			if (target != null) {
				if (performance.now() >= restoreDeadlineRef.current) {
					restoreTargetRef.current = null;
				} else if (Math.abs(window.scrollY - target) > 2) {
					window.scrollTo(0, target);
					scrollYRef.current = target;
				}
			}
			rafId = requestAnimationFrame(loop);
		};
		rafId = requestAnimationFrame(loop);

		const abort = () => {
			restoreTargetRef.current = null;
		};
		window.addEventListener("wheel", abort, { passive: true });
		window.addEventListener("touchmove", abort, { passive: true });
		window.addEventListener("keydown", abort);

		return () => {
			cancelAnimationFrame(rafId);
			window.removeEventListener("wheel", abort);
			window.removeEventListener("touchmove", abort);
			window.removeEventListener("keydown", abort);
		};
	}, [cacheKey]);

	useEffect(() => {
		if (!cacheKey) return undefined;
		let ticking = false;
		const handleScroll = () => {
			if (restoreTargetRef.current != null) return;
			const y = window.scrollY;
			const prev = scrollYRef.current;

			if (prev - y > 3000) {
				const maxScroll = Math.max(
					0,
					document.documentElement.scrollHeight - window.innerHeight,
				);
				if (maxScroll < prev - 1000) return;
			}
			scrollYRef.current = y;
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(() => {
				ticking = false;
				const snap = listScrollCache.get(cacheKey);
				if (snap) snap.scrollY = scrollYRef.current;
			});
		};
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [cacheKey]);

	useEffect(() => {
		if (!cacheKey) return undefined;
		window.history.scrollRestoration = "manual";
		return undefined;
	}, [cacheKey]);

	useEffect(() => {
		if (!cacheKey) return;
		const prev = listScrollCache.get(cacheKey);
		const scrollY =
			restoreTargetRef.current != null
				? restoreTargetRef.current
				: prev
					? prev.scrollY
					: scrollYRef.current;
		listScrollCache.set(cacheKey, {
			items: seriesList,
			page,
			offset: offsetRef.current,
			reachedEnd,
			scrollY,
		});
	}, [cacheKey, seriesList, page, reachedEnd]);

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
