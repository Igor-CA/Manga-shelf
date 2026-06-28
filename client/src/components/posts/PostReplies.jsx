import { useContext } from "react";
import PostCard from "./PostCard";
import PostForm from "./PostForm";
import { UserContext } from "../../contexts/userProvider";
import { usePrompt } from "../../contexts/PromptContext";
import useReplies from "./useReplies";

export default function PostReplies({
	post,
	seriesId,
	volumeId,
	showForm,
	onSubmitted,
}) {
	const { user } = useContext(UserContext);
	const { confirm } = usePrompt();
	const {
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
		deleteReply,
		deletePreview,
	} = useReplies(post, seriesId, volumeId);

	const handleSubmit = async (text) => {
		const ok = await submitReply(text);
		if (ok) onSubmitted();
		return ok;
	};

	const confirmDelete = (replyId, action) =>
		confirm("Tem certeza que deseja excluir sua resposta?", () => action(replyId));

	const ownsReply = (reply) => user && user.username === reply.author.username;

	return (
		<div className="post-card__replies">
			{showForm && (
				<PostForm
					onSubmit={handleSubmit}
					submitting={submitting}
					initialValue={`@${post.author.username} `}
				/>
			)}

			{isExpanded ? (
				<>
					<div className="post-card__replies-list">
						{replies.map((reply) => (
							<PostCard
								key={reply._id}
								post={reply}
								canDelete={ownsReply(reply)}
								onDelete={(id) => confirmDelete(id, deleteReply)}
								isReply={true}
							/>
						))}
					</div>
					{hasMore && (
						<button
							className="button post-card__more-replies"
							onClick={loadMore}
							disabled={loading}
						>
							Ver mais respostas
						</button>
					)}
					<button className="post-card__toggle-replies" onClick={collapse}>
						Ocultar respostas
					</button>
				</>
			) : (
				<>
					{post.replyPreview && !previewHidden && (
						<PostCard
							post={post.replyPreview}
							canDelete={ownsReply(post.replyPreview)}
							onDelete={(id) => confirmDelete(id, deletePreview)}
							isReply={true}
						/>
					)}
					{replyCount > 0 && (
						<button
							className="post-card__toggle-replies"
							onClick={expand}
							disabled={loading}
						>
							{loading
								? "Carregando..."
								: replyCount === 1
									? "Ver 1 resposta"
									: `Ver as ${replyCount} respostas`}
						</button>
					)}
				</>
			)}
		</div>
	);
}
