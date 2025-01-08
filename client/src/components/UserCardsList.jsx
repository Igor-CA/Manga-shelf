import { useCallback, useEffect, useRef, useState } from "react";
import "./UserCard.css";
import SkeletonUserCard from "./SkeletonUserCard";
import UserCard from "./UserCard";
export default function UserCardsList({
	skeletonsCount,
	fetchFunction,
	functionArguments,
	errorComponent,
}) {
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(false);
	const [reachedEnd, setReachedEnd] = useState(false);
	const [usersList, setUsersList] = useState([]);
	const [argsCopy, setArgsCopy] = useState(functionArguments || []);
	const [showErrorComponent, setShowErrorComponent] = useState(false);

	const observer = useRef();
	const lastUserElementRef = useCallback((node) => {
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
				setLoading(false);
			}
		}
	};

	useEffect(() => {
		const resetPage = () => {
			setPage(1);
			setUsersList([]);
			setReachedEnd(false);
			setArgsCopy(functionArguments || []);
		};
		resetPage();
	}, [functionArguments]);
	useEffect(() => {
		updatePage(page, argsCopy);
	}, [page, argsCopy]);

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
