import { useContext } from "react";
import { Link, useParams } from "react-router-dom";
import { FaStar, FaRegCommentAlt } from "react-icons/fa";
import { UserContext } from "../../contexts/userProvider";
import { usePrompt } from "../../contexts/PromptContext";
import PostList from "../../components/posts/PostList";
import usePostList from "../../components/posts/usePostList";
import usePostMutations from "../../components/posts/usePostMutations";
import "../../components/posts/PostsSection.css";
import "./UserCommentsPage.css";

function ContextPill({ context }) {
	if (!context) return null;

	const to = context.volumeId
		? `/volume/${context.volumeId}`
		: `/series/${context.seriesId}`;
	const label = context.volumeId
		? `#${context.seriesTitle} – Vol ${context.volumeNumber}`
		: `#${context.seriesTitle}`;

	return (
		<Link to={to} className="user-comments__pill">
			{label}
		</Link>
	);
}

export default function UserCommentsPage() {
	const { username } = useParams();
	const { user } = useContext(UserContext);
	const { confirm } = usePrompt();

	const postsUrl = `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/data/user/${username}/posts`;
	const reviewList = usePostList(postsUrl, { type: "review" }, "top");
	const commentList = usePostList(postsUrl, { type: "comment" }, "top");

	const reviewMutations = usePostMutations({
		getPost: (id) => reviewList.posts.find((p) => p._id === id),
		patchPost: (id, fields) =>
			reviewList.setPosts((prev) =>
				prev.map((p) => (p._id === id ? { ...p, ...fields } : p)),
			),
	});
	const commentMutations = usePostMutations({
		getPost: (id) => commentList.posts.find((p) => p._id === id),
		patchPost: (id, fields) =>
			commentList.setPosts((prev) =>
				prev.map((p) => (p._id === id ? { ...p, ...fields } : p)),
			),
	});

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
			<PostList
				list={reviewList}
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
				renderPill={(post) => <ContextPill context={post.context} />}
			/>

			<PostList
				list={commentList}
				user={user}
				onDelete={makeDeleteHandler(commentList, commentMutations, {
					confirmText: "Tem certeza que deseja excluir seu comentário?",
					successText: "Comentário removido",
					errorNoun: "comentário",
				})}
				onEdit={commentMutations.editPost}
				label="Comentários"
				icon={<FaRegCommentAlt aria-hidden="true" />}
				emptyMessage="Nenhum comentário ainda."
				renderPill={(post) => <ContextPill context={post.context} />}
			/>
		</div>
	);
}
