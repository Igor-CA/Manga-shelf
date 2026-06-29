import { useContext } from "react";
import PostCard from "./PostCard";
import PostForm from "./PostForm";
import SkeletonPostCard from "./SkeletonPostCard";
import { UserContext } from "../../contexts/userProvider";
import { usePrompt } from "../../contexts/PromptContext";
import useReplies, { REPLIES_PER_PAGE } from "./useReplies";

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
		confirm("Tem certeza que deseja excluir sua resposta?", () =>
			action(replyId),
		);

	const ownsReply = (reply) => user && user.username === reply.author.username;
	const previewShown = post.replyPreview && !previewHidden;

	const renderReplySkeletons = () =>
		Array.from({ length: REPLIES_PER_PAGE }).map((_, i) => (
			<SkeletonPostCard key={`reply-skeleton-${i}`} isReply />
		));

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
						{loading && renderReplySkeletons()}
					</div>
					{hasMore && !loading && (
						<button
							className="button post-card__more-replies"
							onClick={loadMore}
						>
							Ver mais respostas
						</button>
					)}
					<button className="post-card__toggle-replies" onClick={collapse}>
						Ocultar respostas
					</button>
				</>
			) : loading ? (
				<div className="post-card__replies-list">{renderReplySkeletons()}</div>
			) : (
				<>
					{previewShown && (
						<PostCard
							post={post.replyPreview}
							canDelete={ownsReply(post.replyPreview)}
							onDelete={(id) => confirmDelete(id, deletePreview)}
							isReply={true}
						/>
					)}
					{(previewShown ? replyCount > 1 : replyCount > 0) && (
						<button className="post-card__toggle-replies" onClick={expand}>
							{`Ver as ${replyCount} respostas`}
						</button>
					)}
				</>
			)}
		</div>
	);
}
