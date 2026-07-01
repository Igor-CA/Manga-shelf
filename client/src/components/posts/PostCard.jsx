import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import RichText from "../RichText";
import PostReplies from "./PostReplies";
import { UserContext } from "../../contexts/userProvider";
import { messageContext } from "../../contexts/messageStateProvider";
import "./PostCard.css";
import { FaTrash, FaHeart, FaRegHeart, FaStar } from "react-icons/fa";

const READ_MORE_THRESHOLD = 500;

export default function PostCard({
	post,
	canDelete,
	onDelete,
	seriesId,
	volumeId,
	isReply = false,
	onLikeChange,
}) {
	const { user } = useContext(UserContext);
	const { addMessage } = useContext(messageContext);
	const navigate = useNavigate();
	const { author, text, createdAt, isReview, reviewScore } = post;
	const [expanded, setExpanded] = useState(false);
	const [showReplyForm, setShowReplyForm] = useState(false);
	const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
	const [likedByViewer, setLikedByViewer] = useState(post.likedByViewer ?? false);
	const [liking, setLiking] = useState(false);

	const isLong = text.length > READ_MORE_THRESHOLD;
	const shownText =
		isLong && !expanded ? `${text.slice(0, READ_MORE_THRESHOLD)}…` : text;

	const date = new Date(createdAt).toLocaleDateString("pt-BR", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	const handleLike = async () => {
		if (!user) {
			navigate("/login");
			return;
		}
		if (liking) return;

		const wasLiked = likedByViewer;
		const optimisticCount = wasLiked ? likeCount - 1 : likeCount + 1;
		setLikedByViewer(!wasLiked);
		setLikeCount(optimisticCount);
		setLiking(true);

		try {
			const res = await axios({
				method: wasLiked ? "DELETE" : "POST",
				withCredentials: true,
				headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/post/${post._id}/like`,
			});
			setLikeCount(res.data.likeCount);
			setLikedByViewer(res.data.likedByViewer);
			if (onLikeChange) onLikeChange(post._id, res.data);
		} catch (error) {
			setLikedByViewer(wasLiked);
			setLikeCount(likeCount);
			addMessage(error.response?.data?.msg || "Erro ao curtir comentário");
		} finally {
			setLiking(false);
		}
	};

	return (
		<div className={`post-card${isReply ? " post-card--reply" : ""}`}>
			<div className="post-card__header">
				<Link to={`/user/${author.username}`} className="post-card__user">
					{author.profileImageUrl ? (
						<img
							src={`${import.meta.env.REACT_APP_HOST_ORIGIN}${author.profileImageUrl}`}
							alt={author.username}
							className="post-card__avatar"
						/>
					) : (
						<div className="post-card__avatar post-card__avatar--placeholder">
							{author.username?.charAt(0).toUpperCase()}
						</div>
					)}
					<span className="post-card__username">{author.username}</span>
				</Link>
				{isReview && reviewScore != null && (
					<span className="post-card__review-badge">
						<FaStar aria-hidden="true" />
						{reviewScore}
					</span>
				)}
				{canDelete && (
					<button
						className="button button--red"
						onClick={() => onDelete(post._id)}
					>
						<FaTrash />
					</button>
				)}
			</div>

			<p className="post-card__text">
				<RichText text={shownText} />
			</p>
			{isLong && (
				<button
					className="post-card__read-more"
					onClick={() => setExpanded((prev) => !prev)}
				>
					{expanded ? "Ler menos" : "Ler mais"}
				</button>
			)}
			<div className="post-card__footer">
				<span className="post-card__date">{date}</span>
				<div className="post-card__footer-actions">
					{!isReply && user && (
						<button
							className="post-card__reply-btn"
							onClick={() => setShowReplyForm((prev) => !prev)}
						>
							Responder
						</button>
					)}
					<button
						className={`post-card__like-btn${likedByViewer ? " post-card__like-btn--liked" : ""}`}
						onClick={handleLike}
						disabled={liking}
						aria-label={likedByViewer ? "Descurtir" : "Curtir"}
					>
						{likedByViewer ? <FaHeart /> : <FaRegHeart />}
						{likeCount > 0 && <span>{likeCount}</span>}
					</button>
				</div>
			</div>

			{!isReply && (
				<PostReplies
					post={post}
					seriesId={seriesId}
					volumeId={volumeId}
					showForm={showReplyForm}
					onSubmitted={() => setShowReplyForm(false)}
				/>
			)}
		</div>
	);
}
