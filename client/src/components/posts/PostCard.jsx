import { useState } from "react";
import { Link } from "react-router-dom";
import RichText from "../RichText";
import "./PostCard.css";
import { FaTrash } from "react-icons/fa";

const READ_MORE_THRESHOLD = 500;

export default function PostCard({ post, canDelete, onDelete }) {
	const { author, text, createdAt } = post;
	const [expanded, setExpanded] = useState(false);

	const isLong = text.length > READ_MORE_THRESHOLD;
	const shownText =
		isLong && !expanded ? `${text.slice(0, READ_MORE_THRESHOLD)}…` : text;

	const date = new Date(createdAt).toLocaleDateString("pt-BR", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	return (
		<div className="post-card">
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
						<FaTrash></FaTrash>	
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
			<span className="post-card__date">{date}</span>
		</div>
	);
}
