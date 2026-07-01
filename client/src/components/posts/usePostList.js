import { useEffect, useState } from "react";
import axios from "axios";

export const POSTS_PER_PAGE = 20;

export default function usePostList(seriesId, volumeId, type, defaultSort = "top") {
	const [posts, setPosts] = useState([]);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [loading, setLoading] = useState(true);
	const [sort, setSort] = useState(defaultSort);

	const doFetch = async (pageToFetch, sortValue) => {
		const params = { seriesId, p: pageToFetch, sort: sortValue, type };
		if (volumeId) params.volumeId = volumeId;
		const res = await axios({
			method: "GET",
			withCredentials: true,
			headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
			url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/data/posts`,
			params,
		});
		return res.data;
	};

	useEffect(() => {
		let active = true;
		setLoading(true);
		setPosts([]);
		doFetch(1, sort)
			.then((data) => {
				if (!active) return;
				setPosts(data);
				setPage(1);
				setHasMore(data.length === POSTS_PER_PAGE);
			})
			.catch(console.error)
			.finally(() => active && setLoading(false));
		return () => {
			active = false;
		};
	}, [seriesId, volumeId, sort]);

	const loadMore = async () => {
		setLoading(true);
		try {
			const next = page + 1;
			const data = await doFetch(next, sort);
			setPosts((prev) => [...prev, ...data]);
			setPage(next);
			setHasMore(data.length === POSTS_PER_PAGE);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	return { posts, setPosts, hasMore, loading, sort, setSort, loadMore };
}
