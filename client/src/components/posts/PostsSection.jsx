import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { UserContext } from "../../contexts/userProvider";
import { messageContext } from "../../contexts/messageStateProvider";
import { usePrompt } from "../../contexts/PromptContext";
import PostCard from "./PostCard";
import PostForm from "./PostForm";
import SkeletonPostCard from "./SkeletonPostCard";
import "./PostsSection.css";

const POSTS_PER_PAGE = 20;

export default function PostsSection({ seriesId, volumeId }) {
	const { user } = useContext(UserContext);
	const { addMessage, setMessageType } = useContext(messageContext);
	const { confirm } = usePrompt();
	const [posts, setPosts] = useState([]);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [sort, setSort] = useState("top");

	const renderSkeletons = (count) =>
		Array.from({ length: count }).map((_, i) => (
			<SkeletonPostCard key={`skeleton-${i}`} />
		));

	const fetchPage = async (pageToFetch, sortValue) => {
		const params = { seriesId, p: pageToFetch, sort: sortValue };
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
		fetchPage(1, sort)
			.then((data) => {
				if (!active) return;
				setPosts(data);
				setPage(1);
				setHasMore(data.length === POSTS_PER_PAGE);
			})
			.catch((error) => console.error(error))
			.finally(() => active && setLoading(false));
		return () => {
			active = false;
		};
	}, [seriesId, volumeId, sort]);

	const loadMore = async () => {
		setLoadingMore(true);
		try {
			const next = page + 1;
			const data = await fetchPage(next, sort);
			setPosts((prev) => [...prev, ...data]);
			setPage(next);
			setHasMore(data.length === POSTS_PER_PAGE);
		} catch (error) {
			console.error(error);
		} finally {
			setLoadingMore(false);
		}
	};

	const handleSubmit = async (text) => {
		const tempId = `temp-${Date.now()}`;
		const optimistic = {
			_id: tempId,
			text,
			likeCount: 0,
			likedByViewer: false,
			createdAt: new Date().toISOString(),
			author: {
				username: user.username,
				profileImageUrl: user.profileImageUrl,
			},
		};
		setPosts((prev) => [optimistic, ...prev]);
		setSubmitting(true);

		try {
			const res = await axios({
				method: "POST",
				withCredentials: true,
				headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
				data: { seriesId, volumeId, text },
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/post`,
			});
			setPosts((prev) =>
				prev.map((p) =>
					p._id === tempId
						? {
								...p,
								_id: res.data.post._id,
								createdAt: res.data.post.createdAt,
							}
						: p,
				),
			);
			setMessageType("Success");
			addMessage("Comentário publicado");
			return true;
		} catch (error) {
			setPosts((prev) => prev.filter((p) => p._id !== tempId));
			addMessage(error.response?.data?.msg || "Erro ao publicar comentário");
			return false;
		} finally {
			setSubmitting(false);
		}
	};

	const deletePost = async (postId) => {
		const previous = posts;
		setPosts((prev) => prev.filter((p) => p._id !== postId));
		try {
			await axios({
				method: "DELETE",
				withCredentials: true,
				headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/post/${postId}`,
			});
			setMessageType("Success");
			addMessage("Comentário removido");
		} catch (error) {
			setPosts(previous);
			addMessage(error.response?.data?.msg || "Erro ao remover comentário");
		}
	};

	const handleDelete = (postId) => {
		confirm("Tem certeza que deseja excluir seu comentário?", () =>
			deletePost(postId),
		);
	};

	return (
		<div className="container">
			<div className="content-overall__container">
				<div className="overall-content__container">
					<hr style={{ margin: "0px 10px" }} />
					<h2 className="collection-lable">Comentários</h2>
					<div className="posts-section">
						{user && (
							<PostForm onSubmit={handleSubmit} submitting={submitting} />
						)}

						<div className="posts-section__sort">
							<button
								className={`posts-section__sort-btn${sort === "top" ? " posts-section__sort-btn--active" : ""}`}
								onClick={() => setSort("top")}
							>
								Mais curtidos
							</button>
							<button
								className={`posts-section__sort-btn${sort === "recent" ? " posts-section__sort-btn--active" : ""}`}
								onClick={() => setSort("recent")}
							>
								Mais recentes
							</button>
						</div>

						{loading ? (
							<div className="posts-list">
								{renderSkeletons(POSTS_PER_PAGE)}
							</div>
						) : posts.length === 0 ? (
							<p className="posts-section__empty">
								Nenhum comentário ainda. Seja o primeiro a comentar!
							</p>
						) : (
							<div className="posts-list">
								{posts.map((post) => (
									<PostCard
										key={post._id}
										post={post}
										canDelete={user && user.username === post.author?.username}
										onDelete={handleDelete}
										seriesId={seriesId}
										volumeId={volumeId}
									/>
								))}
								{loadingMore && renderSkeletons(POSTS_PER_PAGE)}
							</div>
						)}

						{hasMore && !loadingMore && (
							<button className="button posts-section__more" onClick={loadMore}>
								Ver mais
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
