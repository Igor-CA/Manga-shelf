import { useCallback, useEffect, useRef, useState } from "react";
import "./UserCard.css";
import SkeletonUserCard from "./SkeletonUserCard";
import UserCard from "./UserCard";
import useListScrollRestoration from "../../utils/useListScrollRestoration";
export default function UserCardsList({
	skeletonsCount,
	fetchFunction,
	functionArguments,
	errorComponent,
	cacheKey,
}) {
	// Restoration is opt-in: without a cacheKey this behaves exactly as it always has.
	// Safe to use the cached (no-refetch) mode here because UserCard is a pure display card
	// with no actions, so the viewer cannot make this listing stale.
	const { initial, persist, cancelRestore } = useListScrollRestoration(cacheKey);

	const [page, setPage] = useState(() => (initial ? initial.page : 1));
	const [loading, setLoading] = useState(false);
	const [reachedEnd, setReachedEnd] = useState(() => (initial ? initial.reachedEnd : false));
	const [usersList, setUsersList] = useState(() => (initial ? initial.items : []));
	const [argsCopy, setArgsCopy] = useState(functionArguments || []);
	const [showErrorComponent, setShowErrorComponent] = useState(false);

	// The page our state was seeded for, so the fetch effect doesn't immediately re-fetch a
	// page we already have. Compared by value, so it survives StrictMode's double-invoke.
	const hydratedPageRef = useRef(initial ? initial.page : null);
	const lastProcessedKeyRef = useRef(cacheKey);

	const loadingRef = useRef(false);
	const requestedPageRef = useRef(initial ? initial.page : 0);
	const generationRef = useRef(0);

	const observer = useRef();
	const lastUserElementRef = useCallback((node) => {
		if (observer.current) observer.current.disconnect();
		observer.current = new IntersectionObserver((entries) => {
			if (!entries[0].isIntersecting) return;
			if (loadingRef.current) return;
			setPage((prevPage) =>
				prevPage > requestedPageRef.current ? prevPage : prevPage + 1
			);
		});
		if (node) observer.current.observe(node);
	}, []);

	const updatePage = async (targetPage, aditionalArguments) => {
		if (!loadingRef.current && !reachedEnd) {
			const generation = generationRef.current;
			requestedPageRef.current = targetPage;
			loadingRef.current = true;
			setLoading(true);
			try {
				if (typeof fetchFunction !== "function") return;
				const resultList = await fetchFunction(
					targetPage,
					...aditionalArguments
				);
				if (generation !== generationRef.current) return;
				if (resultList.length > 0) {
					setUsersList((previousList) =>
						targetPage === 1
							? [...resultList]
							: [...previousList, ...resultList]
					);
					if (resultList.length < skeletonsCount) {
						setReachedEnd(true);
					}
					setShowErrorComponent(false);
				} else {
					if (page === 1) {
						setUsersList([]);
						setShowErrorComponent(true);
					}
					setReachedEnd(true);
				}
			} catch (error) {
				console.error("Error fetching user Data:", error);
			} finally {
				if (generation === generationRef.current) {
					loadingRef.current = false;
					setLoading(false);
				}
			}
		}
	};

	// Reset on a filter/search change. The `cacheKey &&` matters: without a cacheKey both
	// sides are undefined, the guard would always be true, and the reset would never run —
	// silently breaking search, since argsCopy would never update.
	useEffect(() => {
		if (cacheKey && lastProcessedKeyRef.current === cacheKey) return;
		lastProcessedKeyRef.current = cacheKey;
		cancelRestore();
		hydratedPageRef.current = null;
		
		generationRef.current += 1;
		loadingRef.current = false;
		requestedPageRef.current = 0;

		setPage(1);
		setUsersList([]);
		setReachedEnd(false);
		setArgsCopy(functionArguments || []);
	}, [functionArguments, cacheKey, cancelRestore]);

	useEffect(() => {
		if (hydratedPageRef.current != null && page === hydratedPageRef.current) return;
		updatePage(page, argsCopy);
	}, [page, argsCopy]);

	// Keep the stored snapshot current. Effect BODY, never a cleanup.
	useEffect(() => {
		persist({ items: usersList, page, reachedEnd });
	}, [persist, usersList, page, reachedEnd]);

	return (
		<div className="users-container">
			{usersList.length > 0 &&
				usersList.map((user, index) => (
					<div
						key={user._id}
						ref={
							index === usersList.length - 1 ? lastUserElementRef : undefined
						}
						className="user-card"
					>
						<UserCard user={user}></UserCard>
					</div>
				))}

			{loading &&
				Array(skeletonsCount)
					.fill()
					.map((_, id) => {
						return <SkeletonUserCard key={id}></SkeletonUserCard>;
					})}
			{showErrorComponent && !loading && errorComponent()}
		</div>
	);
}
