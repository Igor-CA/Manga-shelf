import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { UserContext } from "../../contexts/userProvider";
import { usePrompt } from "../../contexts/PromptContext";
import PostCard from "../../components/posts/PostCard";
import SkeletonPostCard from "../../components/posts/SkeletonPostCard";
import usePostMutations from "../../components/posts/usePostMutations";
import usePageMeta from "../../utils/usePageMeta";
import "../../components/posts/PostsSection.css";
import "./CommentThreadPage.css";

export default function CommentThreadPage() {
	const { postId } = useParams();
	const navigate = useNavigate();
	const { user } = useContext(UserContext);
	const { confirm } = usePrompt();

	const [topLevel, setTopLevel] = useState(null);
	const [replies, setReplies] = useState(null);
	const [highlightId, setHighlightId] = useState(null);
	const [context, setContext] = useState(null);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);

	const { editPost, deletePost } = usePostMutations({
		seriesId: context?.seriesId,
		volumeId: context?.volumeId,
		getPost: () => topLevel,
		patchPost: (id, fields) => setTopLevel((prev) => ({ ...prev, ...fields })),
	});

	useEffect(() => {
		let active = true;
		setLoading(true);
		setNotFound(false);

		axios({
			method: "GET",
			withCredentials: true,
			headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
			url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/data/post/${postId}/thread`,
		})
			.then((res) => {
				if (!active) return;
				setTopLevel(res.data.topLevel);
				setReplies(res.data.replies);
				setHighlightId(res.data.highlightId);
				setContext(res.data.context);
			})
			.catch((error) => {
				if (!active) return;
				setNotFound(true);
				if (error.response?.status !== 404) {
					console.error("Error fetching comment thread:", error);
				}
			})
			.finally(() => active && setLoading(false));

		return () => {
			active = false;
		};
	}, [postId]);

	const target = context
		? `${context.seriesTitle}${context.volumeId ? ` - Volume ${context.volumeNumber}` : ""}`
		: null;
	usePageMeta(
		target && `${topLevel?.isReview ? "Review" : "Comentário"} sobre ${target}`,
		target &&
			`Leia o que ${topLevel?.author?.username} escreveu sobre ${target} e participe da conversa no MangaShelf.`,
	);

	if (loading) {
		return (
			<div className="page-content">
				<div className="container">
					<div className="posts-list" style={{ padding: "1rem" }}>
						<SkeletonPostCard />
					</div>
				</div>
			</div>
		);
	}

	if (notFound) {
		return (
			<div className="page-content">
				<div className="container">
					<p className="comment-thread__not-found">
						Esse comentário não existe mais
					</p>
				</div>
			</div>
		);
	}

	const detailLink = context.volumeId
		? `/volume/${context.volumeId}`
		: `/series/${context.seriesId}`;
	const commentsFeedLink = `${detailLink}/comments`;

	const handleDeleteTopLevel = (id) => {
		const confirmText = topLevel.isReview
			? "Tem certeza que deseja excluir sua review?"
			: "Tem certeza que deseja excluir seu comentário?";
		confirm(confirmText, async () => {
			const ok = await deletePost(id, {
				successText: topLevel.isReview ? "Review removida" : "Comentário removido",
			});
			if (ok) navigate(commentsFeedLink);
		});
	};

	return (
		<div className="page-content">
			<div className="container">
				<div className="comment-thread__context-card">
					<Link to={detailLink} className="comment-thread__context-cover-link">
						{context.coverFilename ? (
							<img
								src={`${import.meta.env.REACT_APP_HOST_ORIGIN}/images/medium/${context.coverFilename}`}
								alt={context.seriesTitle}
								className="comment-thread__context-cover"
							/>
						) : (
							<div className="comment-thread__context-cover comment-thread__context-cover--adult">
								+18
							</div>
						)}
					</Link>
					<div className="comment-thread__context-info">
						<Link to={detailLink} className="comment-thread__context-title">
							{context.seriesTitle}
							{context.volumeId ? ` · Vol. ${context.volumeNumber}` : ""}
						</Link>
						<Link
							to={commentsFeedLink}
							className="comment-thread__context-back-link"
						>
							Ver todos os comentários
						</Link>
					</div>
				</div>

				<div className="posts-list" style={{ padding: "0 10px" }}>
					<PostCard
						post={topLevel}
						canDelete={user && user.username === topLevel.author?.username}
						onDelete={handleDeleteTopLevel}
						onEdit={editPost}
						seriesId={context.seriesId}
						volumeId={context.volumeId}
						highlightId={highlightId}
						initialReplies={replies}
						showThreadLink={false}
					/>
				</div>
			</div>
		</div>
	);
}
