import { useContext, useState } from "react";
import axios from "axios";
import { FaStar, FaRegCommentAlt } from "react-icons/fa";
import { UserContext } from "../../contexts/userProvider";
import { messageContext } from "../../contexts/messageStateProvider";
import { usePrompt } from "../../contexts/PromptContext";
import PostForm from "./PostForm";
import PostList from "./PostList";
import usePostList from "./usePostList";
import createPostRequest from "./createPostRequest";
import usePostMutations from "./usePostMutations";
import "./PostsSection.css";

export default function PostsSection({ seriesId, volumeId, rating }) {
	const { user } = useContext(UserContext);
	const { addMessage, setMessageType } = useContext(messageContext);
	const { confirm } = usePrompt();
	const [submitting, setSubmitting] = useState(false);

	const postsUrl = `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/data/posts`;
	const reviewList = usePostList(
		postsUrl,
		{ seriesId, volumeId, type: "review" },
		"top",
	);
	const commentList = usePostList(
		postsUrl,
		{ seriesId, volumeId, type: "comment" },
		"top",
	);

	const reviewMutations = usePostMutations({
		seriesId,
		volumeId,
		getPost: (id) => reviewList.posts.find((p) => p._id === id),
		patchPost: (id, fields) =>
			reviewList.setPosts((prev) =>
				prev.map((p) => (p._id === id ? { ...p, ...fields } : p)),
			),
	});
	const commentMutations = usePostMutations({
		seriesId,
		volumeId,
		getPost: (id) => commentList.posts.find((p) => p._id === id),
		patchPost: (id, fields) =>
			commentList.setPosts((prev) =>
				prev.map((p) => (p._id === id ? { ...p, ...fields } : p)),
			),
	});

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

	const optimisticAuthor = () => ({
		username: user.username,
		profileImageUrl: user.profileImageUrl,
	});

	const submitReview = async (text, score, media) => {
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
		const optimisticImage = media?.image ? URL.createObjectURL(media.image) : null;
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
				image: optimisticImage,
				isSpoiler: !!media?.isSpoiler,
				isAdultContent: !!media?.isAdultContent,
			},
			...prev,
		]);

		try {
			const res = await createPostRequest({
				seriesId,
				volumeId,
				text,
				isReview: true,
				isSpoiler: media?.isSpoiler,
				isAdultContent: media?.isAdultContent,
				image: media?.image,
			});
			if (optimisticImage) URL.revokeObjectURL(optimisticImage);
			reviewList.setPosts((prev) =>
				prev.map((p) =>
					p._id === tempId
						? {
								...p,
								_id: res.data.post._id,
								createdAt: res.data.post.createdAt,
								image: res.data.post.image,
							}
						: p,
				),
			);
			setMessageType("Success");
			addMessage("Review publicada");
			return true;
		} catch (err) {
			if (optimisticImage) URL.revokeObjectURL(optimisticImage);
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

	const submitComment = async (text, media) => {
		const tempId = `temp-${Date.now()}`;
		const optimisticImage = media?.image ? URL.createObjectURL(media.image) : null;
		commentList.setPosts((prev) => [
			{
				_id: tempId,
				text,
				likeCount: 0,
				likedByViewer: false,
				replyCount: 0,
				createdAt: new Date().toISOString(),
				author: optimisticAuthor(),
				image: optimisticImage,
				isSpoiler: !!media?.isSpoiler,
				isAdultContent: !!media?.isAdultContent,
			},
			...prev,
		]);

		try {
			const res = await createPostRequest({
				seriesId,
				volumeId,
				text,
				isSpoiler: media?.isSpoiler,
				isAdultContent: media?.isAdultContent,
				image: media?.image,
			});
			if (optimisticImage) URL.revokeObjectURL(optimisticImage);
			commentList.setPosts((prev) =>
				prev.map((p) =>
					p._id === tempId
						? {
								...p,
								_id: res.data.post._id,
								createdAt: res.data.post.createdAt,
								image: res.data.post.image,
							}
						: p,
				),
			);
			setMessageType("Success");
			addMessage("Comentário publicado");
			return true;
		} catch (err) {
			if (optimisticImage) URL.revokeObjectURL(optimisticImage);
			commentList.setPosts((prev) => prev.filter((p) => p._id !== tempId));
			addMessage(err.response?.data?.msg || "Erro ao publicar comentário");
			return false;
		}
	};

	const handleSubmit = async (text, reviewData, media) => {
		setSubmitting(true);
		try {
			if (reviewData?.isReview) {
				return await submitReview(text, reviewData.score, media);
			}
			return await submitComment(text, media);
		} finally {
			setSubmitting(false);
		}
	};

	const makeDeleteHandler =
		(list, mutations, { confirmText, successText, errorNoun }) =>
		(postId) => {
			confirm(confirmText, () =>
				mutations.deletePost(postId, {
					applyRemoval: () => {
						const previous = list.posts;
						list.setPosts((prev) => prev.filter((p) => p._id !== postId));
						return () => list.setPosts(previous);
					},
					successText,
					errorText: `Erro ao remover ${errorNoun}`,
				}),
			);
		};

	return (
		<div className="container">
			<div className="content-overall__container">
				<div className="overall-content__container">
					<hr style={{ margin: "0px 10px" }} />

					{user && (
						<div style={{ padding: "0.75rem" }}>
							<PostForm
								isTopLevel
								onSubmit={handleSubmit}
								submitting={submitting}
							/>
						</div>
					)}

					<PostList
						list={reviewList}
						seriesId={seriesId}
						volumeId={volumeId}
						user={user}
						onDelete={makeDeleteHandler(reviewList, reviewMutations, {
							confirmText: "Tem certeza que deseja excluir sua review?",
							successText: "Review removida",
							errorNoun: "review",
						})}
						onEdit={reviewMutations.editPost}
						label="Reviews"
						icon={<FaStar aria-hidden="true" />}
						emptyMessage="Nenhuma review ainda."
					/>

					<PostList
						list={commentList}
						seriesId={seriesId}
						volumeId={volumeId}
						user={user}
						onDelete={makeDeleteHandler(commentList, commentMutations, {
							confirmText: "Tem certeza que deseja excluir seu comentário?",
							successText: "Comentário removido",
							errorNoun: "comentário",
						})}
						onEdit={commentMutations.editPost}
						label="Comentários"
						icon={<FaRegCommentAlt aria-hidden="true" />}
						emptyMessage="Nenhum comentário ainda. Seja o primeiro a comentar!"
					/>
				</div>
			</div>
		</div>
	);
}
