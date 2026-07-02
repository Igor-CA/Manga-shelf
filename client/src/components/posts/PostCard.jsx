import { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import RichText from "../RichText";
import PostReplies from "./PostReplies";
import PostForm from "./PostForm";
import { UserContext } from "../../contexts/userProvider";
import { messageContext } from "../../contexts/messageStateProvider";
import "./PostCard.css";
import {
	FaTrash,
	FaHeart,
	FaRegHeart,
	FaStar,
	FaEllipsisH,
	FaReply,
	FaPen,
} from "react-icons/fa";

const READ_MORE_THRESHOLD = 500;

export default function PostCard({
	post,
	canDelete,
	onDelete,
	onEdit,
	seriesId,
	volumeId,
	isReply = false,
	onLikeChange,
}) {
	const { user } = useContext(UserContext);
	const { addMessage } = useContext(messageContext);
	const navigate = useNavigate();
	const {
		author,
		text,
		createdAt,
		editedAt,
		isReview,
		reviewScore,
		image,
		isSpoiler,
		isAdultContent,
	} = post;
	const [expanded, setExpanded] = useState(false);
	const [revealed, setRevealed] = useState(false);
	const [showReplyForm, setShowReplyForm] = useState(false);
	const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
	const [likedByViewer, setLikedByViewer] = useState(post.likedByViewer ?? false);
	const [liking, setLiking] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [editing, setEditing] = useState(false);
	const [editSubmitting, setEditSubmitting] = useState(false);
	const menuRef = useRef(null);

	useEffect(() => {
		if (!menuOpen) return;
		const onDocClick = (e) => {
			if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
		};
		const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
		document.addEventListener("mousedown", onDocClick);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDocClick);
			document.removeEventListener("keydown", onKey);
		};
	}, [menuOpen]);

	const menuActions = [];
	if (canDelete) {
		if (onEdit) {
			menuActions.push({
				key: "edit",
				label: "Editar",
				icon: <FaPen aria-hidden="true" />,
				onClick: () => setEditing(true),
			});
		}
		menuActions.push({
			key: "delete",
			label: "Excluir",
			icon: <FaTrash aria-hidden="true" />,
			danger: true,
			onClick: () => onDelete(post._id),
		});
	}

	const handleEditSubmit = async ({ text: newText, isSpoiler: newIsSpoiler, isAdultContent: newIsAdultContent, image: newImage }) => {
		setEditSubmitting(true);
		try {
			const ok = await onEdit(post._id, {
				text: newText,
				isSpoiler: newIsSpoiler,
				isAdultContent: newIsAdultContent,
				image: newImage,
			});
			if (ok) setEditing(false);
			return ok;
		} finally {
			setEditSubmitting(false);
		}
	};

	const isLong = text.length > READ_MORE_THRESHOLD;
	const shownText =
		isLong && !expanded ? `${text.slice(0, READ_MORE_THRESHOLD)}…` : text;

	const date = new Date(createdAt).toLocaleDateString("pt-BR", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	const bustedImage =
		image && !image.startsWith("blob:") && editedAt
			? `${image}?t=${new Date(editedAt).getTime()}`
			: image;

	const imageSrc = bustedImage
		? bustedImage.startsWith("blob:")
			? bustedImage
			: `${import.meta.env.REACT_APP_HOST_ORIGIN}${bustedImage}`
		: null;

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
				<Link
					to={`/user/${author.username}`}
					className="post-card__avatar-link"
				>
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
				</Link>
				<div className="post-card__user-info">
					<div className="post-card__user-line">
						<Link
							to={`/user/${author.username}`}
							className="post-card__username"
						>
							{author.username}
						</Link>
						{isReview && reviewScore != null && (
							<span className="post-card__review-badge">
								<FaStar aria-hidden="true" />
								{reviewScore}
							</span>
						)}
					</div>
					<span className="post-card__date">
						{date}
						{editedAt && <span className="post-card__edited"> · editado</span>}
					</span>
				</div>
				<div className="post-card__header-right">
					{menuActions.length > 0 && (
						<div className="post-card__menu" ref={menuRef}>
							<button
								type="button"
								className="post-card__menu-btn"
								onClick={() => setMenuOpen((o) => !o)}
								aria-haspopup="menu"
								aria-expanded={menuOpen}
								aria-label="Mais opções"
							>
								<FaEllipsisH />
							</button>
							{menuOpen && (
								<ul className="post-card__menu-list" role="menu">
									{menuActions.map((action) => (
										<li key={action.key} role="none">
											<button
												type="button"
												role="menuitem"
												className={`post-card__menu-item${action.danger ? " post-card__menu-item--danger" : ""}`}
												onClick={() => {
													setMenuOpen(false);
													action.onClick();
												}}
											>
												{action.icon}
												<span>{action.label}</span>
											</button>
										</li>
									))}
								</ul>
							)}
						</div>
					)}
				</div>
			</div>

			{editing ? (
				<PostForm
					isEdit
					isTopLevel={false}
					initialValue={text}
					initialIsSpoiler={isSpoiler}
					initialIsAdultContent={isAdultContent}
					initialImage={bustedImage}
					submitting={editSubmitting}
					onSubmit={handleEditSubmit}
					onCancel={() => setEditing(false)}
				/>
			) : isSpoiler && !revealed ? (
				<button
					type="button"
					className="post-card__spoiler-cover"
					onClick={() => setRevealed(true)}
				>
					Contém spoiler. Clique para ver
				</button>
			) : (
				<>
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
					{imageSrc ? (
						<img
							src={imageSrc}
							alt=""
							className="post-card__image"
							loading="lazy"
						/>
					) : isAdultContent ? (
						<div className="post-card__adult-block">
							Imagem classificada como +18
						</div>
					) : null}
				</>
			)}
			<div className="post-card__footer">
				<button
					className={`post-card__like-btn${likedByViewer ? " post-card__like-btn--liked" : ""}`}
					onClick={handleLike}
					disabled={liking}
					aria-label={likedByViewer ? "Descurtir" : "Curtir"}
				>
					{likedByViewer ? <FaHeart /> : <FaRegHeart />}
					{likeCount > 0 && <span>{likeCount}</span>}
				</button>
				{!isReply && user && (
					<button
						className="post-card__reply-btn"
						onClick={() => setShowReplyForm((prev) => !prev)}
					>
						<FaReply aria-hidden="true" />
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
