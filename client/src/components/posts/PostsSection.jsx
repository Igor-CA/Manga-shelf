import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "../../contexts/userProvider";
import { messageContext } from "../../contexts/messageStateProvider";
import { usePrompt } from "../../contexts/PromptContext";
import PostCard from "./PostCard";
import PostForm from "./PostForm";
import SkeletonPostCard from "./SkeletonPostCard";
import usePostList, { POSTS_PER_PAGE } from "./usePostList";
import "./PostsSection.css";

function renderSkeletons(count) {
	return Array.from({ length: count }).map((_, i) => (
		<SkeletonPostCard key={`skeleton-${i}`} />
	));
}

function PostList({
	list,
	seriesId,
	volumeId,
	user,
	onDelete,
	emptyMessage,
	label,
}) {
	const { posts, hasMore, loading, sort, setSort, loadMore } = list;

	return (
		<div className="posts-section">
			<h2 className="collection-lable">{label}</h2>

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

			{loading && posts.length === 0 ? (
				<div className="posts-list">{renderSkeletons(POSTS_PER_PAGE)}</div>
			) : posts.length === 0 ? (
				<p className="posts-section__empty">{emptyMessage}</p>
			) : (
				<div className="posts-list">
					{posts.map((post) => (
						<PostCard
							key={post._id}
							post={post}
							canDelete={user && user.username === post.author?.username}
							onDelete={onDelete}
							seriesId={seriesId}
							volumeId={volumeId}
						/>
					))}
					{loading && renderSkeletons(POSTS_PER_PAGE)}
				</div>
			)}

			{hasMore && !loading && (
				<button className="button posts-section__more" onClick={loadMore}>
					Ver mais
				</button>
			)}
		</div>
	);
}

export default function PostsSection({ seriesId, volumeId, rating }) {
	const { user } = useContext(UserContext);
	const { addMessage, setMessageType } = useContext(messageContext);
	const { confirm } = usePrompt();
	const [submitting, setSubmitting] = useState(false);

	const reviewList = usePostList(seriesId, volumeId, "review", "top");
	const commentList = usePostList(seriesId, volumeId, "comment", "top");

	const ratingRequest = (method, score) =>
		axios({
			method,
			withCredentials: true,
			headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
			url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/rating`,
			data: {
				seriesId,
				...(volumeId ? { volumeId } : {}),
				...(score != null ? { score } : {}),
			},
		});

	const reviewPostRequest = (text) =>
		axios({
			method: "POST",
			withCredentials: true,
			headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
			url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/post`,
			data: {
				seriesId,
				...(volumeId ? { volumeId } : {}),
				text,
				isReview: true,
			},
		});

	const optimisticAuthor = () => ({
		username: user.username,
		profileImageUrl: user.profileImageUrl,
	});

	const submitReview = async (text, score) => {
		const prevScore = rating?.manualScore ?? null;
		const rollbackRating = rating ? rating.applyOptimistic(score) : () => {};

		try {
			await ratingRequest("POST", score);
		} catch (err) {
			rollbackRating();
			addMessage(err.response?.data?.msg || "Erro ao salvar nota");
			return false;
		}

		const tempId = `temp-${Date.now()}`;
		reviewList.setPosts((prev) => [
			{
				_id: tempId,
				text,
				isReview: true,
				reviewScore: score,
				likeCount: 0,
				likedByViewer: false,
				replyCount: 0,
				createdAt: new Date().toISOString(),
				author: optimisticAuthor(),
			},
			...prev,
		]);

		try {
			const res = await reviewPostRequest(text);
			reviewList.setPosts((prev) =>
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
			addMessage("Review publicada");
			return true;
		} catch (err) {
			reviewList.setPosts((prev) => prev.filter((p) => p._id !== tempId));
			try {
				if (prevScore != null) await ratingRequest("POST", prevScore);
				else await ratingRequest("DELETE", null);
			} catch {}
			rollbackRating();
			addMessage(err.response?.data?.msg || "Erro ao publicar review");
			return false;
		}
	};

	const submitComment = async (text) => {
		const tempId = `temp-${Date.now()}`;
		commentList.setPosts((prev) => [
			{
				_id: tempId,
				text,
				likeCount: 0,
				likedByViewer: false,
				replyCount: 0,
				createdAt: new Date().toISOString(),
				author: optimisticAuthor(),
			},
			...prev,
		]);

		try {
			const res = await axios({
				method: "POST",
				withCredentials: true,
				headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/post`,
				data: { seriesId, ...(volumeId ? { volumeId } : {}), text },
			});
			commentList.setPosts((prev) =>
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
		} catch (err) {
			commentList.setPosts((prev) => prev.filter((p) => p._id !== tempId));
			addMessage(err.response?.data?.msg || "Erro ao publicar comentário");
			return false;
		}
	};

	const handleSubmit = async (text, reviewData) => {
		setSubmitting(true);
		try {
			if (reviewData?.isReview) {
				return await submitReview(text, reviewData.score);
			}
			return await submitComment(text);
		} finally {
			setSubmitting(false);
		}
	};

	const makeDeleteHandler =
		(list, { confirmText, successText, errorNoun }) =>
		(postId) => {
			confirm(confirmText, async () => {
				const previous = list.posts;
				list.setPosts((prev) => prev.filter((p) => p._id !== postId));
				try {
					await axios({
						method: "DELETE",
						withCredentials: true,
						headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
						url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/post/${postId}`,
					});
					setMessageType("Success");
					addMessage(successText);
				} catch (err) {
					list.setPosts(previous);
					addMessage(err.response?.data?.msg || `Erro ao remover ${errorNoun}`);
				}
			});
		};

	return (
		<div className="container">
			<div className="content-overall__container">
				<div className="overall-content__container">
					<hr style={{ margin: "0px 10px" }} />

					{user && (
						<div style={{ padding: "0 10px" }}>
							<PostForm
								isTopLevel
								onSubmit={handleSubmit}
								submitting={submitting}
								currentScore={rating?.manualScore ?? null}
							/>
						</div>
					)}

					<PostList
						list={reviewList}
						seriesId={seriesId}
						volumeId={volumeId}
						user={user}
						onDelete={makeDeleteHandler(reviewList, {
							confirmText: "Tem certeza que deseja excluir sua review?",
							successText: "Review removida",
							errorNoun: "review",
						})}
						label="Reviews"
						emptyMessage="Nenhuma review ainda."
					/>

					<PostList
						list={commentList}
						seriesId={seriesId}
						volumeId={volumeId}
						user={user}
						onDelete={makeDeleteHandler(commentList, {
							confirmText: "Tem certeza que deseja excluir seu comentário?",
							successText: "Comentário removido",
							errorNoun: "comentário",
						})}
						label="Comentários"
						emptyMessage="Nenhum comentário ainda. Seja o primeiro a comentar!"
					/>
				</div>
			</div>
		</div>
	);
}
