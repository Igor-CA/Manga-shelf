import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import RichText from "../RichText";
import PostReplies from "./PostReplies";
import { UserContext } from "../../contexts/userProvider";
import "./PostCard.css";
import { FaTrash } from "react-icons/fa";

const READ_MORE_THRESHOLD = 500;

export default function PostCard({
	post,
	canDelete,
	onDelete,
	seriesId,
	volumeId,
	isReply = false,
}) {
	const { user } = useContext(UserContext);
	const { author, text, createdAt } = post;
	const [expanded, setExpanded] = useState(false);
	const [showReplyForm, setShowReplyForm] = useState(false);

	const isLong = text.length > READ_MORE_THRESHOLD;
	const shownText =
		isLong && !expanded ? `${text.slice(0, READ_MORE_THRESHOLD)}…` : text;

	const date = new Date(createdAt).toLocaleDateString("pt-BR", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

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
				{!isReply && user && (
					<button
						className="post-card__reply-btn"
						onClick={() => setShowReplyForm((prev) => !prev)}
					>
						Responder
					</button>
				)}
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
