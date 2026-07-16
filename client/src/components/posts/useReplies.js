import { useState, useContext } from "react";
import axios from "axios";
import { UserContext } from "../../contexts/userProvider";
import { messageContext } from "../../contexts/messageStateProvider";
import createPostRequest from "./createPostRequest";
import usePostMutations from "./usePostMutations";

export const REPLIES_PER_PAGE = 5;

export default function useReplies(post, seriesId, volumeId, initialReplies = null) {
	const { user } = useContext(UserContext);
	const { addMessage } = useContext(messageContext);

	const [replyCount, setReplyCount] = useState(post.replyCount || 0);
	const [replies, setReplies] = useState(initialReplies);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [previewHidden, setPreviewHidden] = useState(false);

	const { editPost: editReply, deletePost } = usePostMutations({
		seriesId,
		volumeId,
		getPost: (id) => (replies ? replies.find((r) => r._id === id) : null),
		patchPost: (id, fields) =>
			setReplies((prev) =>
				prev ? prev.map((r) => (r._id === id ? { ...r, ...fields } : r)) : prev,
			),
	});

	const isExpanded = replies !== null;

	const fetchReplies = async (pageNum) => {
		const res = await axios({
			method: "GET",
			withCredentials: true,
			headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
			url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/data/posts/${post._id}/replies`,
			params: { p: pageNum },
		});
		return res.data;
	};

	const expand = async () => {
		setLoading(true);
		try {
			const data = await fetchReplies(1);
			setReplies(data);
			setPage(1);
			setHasMore(data.length === REPLIES_PER_PAGE);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const collapse = () => setReplies(null);

	const loadMore = async () => {
		setLoading(true);
		try {
			const next = page + 1;
			const data = await fetchReplies(next);
			setReplies((prev) => [...prev, ...data]);
			setPage(next);
			setHasMore(data.length === REPLIES_PER_PAGE);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const submitReply = async (text, media) => {
		const tempId = `temp-${Date.now()}`;
		const optimisticImage = media?.image ? URL.createObjectURL(media.image) : null;
		const optimistic = {
			_id: tempId,
			text,
			createdAt: new Date().toISOString(),
			author: {
				username: user.username,
				profileImageUrl: user.profileImageUrl,
			},
			image: optimisticImage,
			isSpoiler: !!media?.isSpoiler,
			isAdultContent: !!media?.isAdultContent,
		};
		setReplies((prev) => (prev ? [...prev, optimistic] : [optimistic]));
		setReplyCount((prev) => prev + 1);
		setSubmitting(true);

		try {
			const res = await createPostRequest({
				seriesId,
				volumeId,
				text,
				parentId: post._id,
				isSpoiler: media?.isSpoiler,
				isAdultContent: media?.isAdultContent,
				image: media?.image,
			});
			if (optimisticImage) URL.revokeObjectURL(optimisticImage);
			setReplies((prev) =>
				prev.map((r) =>
					r._id === tempId
						? {
								...r,
								_id: res.data.post._id,
								createdAt: res.data.post.createdAt,
								image: res.data.post.image,
							}
						: r,
				),
			);
			addMessage("Resposta publicada", "Success");
			return true;
		} catch (error) {
			if (optimisticImage) URL.revokeObjectURL(optimisticImage);
			setReplies((prev) => prev.filter((r) => r._id !== tempId));
			setReplyCount((prev) => Math.max(0, prev - 1));
			addMessage(error.response?.data?.msg || "Erro ao publicar resposta");
			return false;
		} finally {
			setSubmitting(false);
		}
	};

	const deleteReply = async (replyId) => {
		await deletePost(replyId, {
			applyRemoval: () => {
				const previous = replies;
				setReplies((prev) => (prev ? prev.filter((r) => r._id !== replyId) : prev));
				setReplyCount((prev) => Math.max(0, prev - 1));
				return () => {
					setReplies(previous);
					setReplyCount((prev) => prev + 1);
				};
			},
			successText: "Resposta removida",
			errorText: "Erro ao remover resposta",
		});
	};

	const deletePreview = async (replyId) => {
		const ok = await deletePost(replyId, {
			successText: "Resposta removida",
			errorText: "Erro ao remover resposta",
		});
		if (ok) {
			setPreviewHidden(true);
			setReplyCount((prev) => Math.max(0, prev - 1));
		}
	};

	return {
		replyCount,
		replies,
		isExpanded,
		hasMore,
		loading,
		submitting,
		previewHidden,
		expand,
		collapse,
		loadMore,
		submitReply,
		editReply,
		deleteReply,
		deletePreview,
	};
}
