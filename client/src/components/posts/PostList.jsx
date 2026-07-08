import PostCard from "./PostCard";
import SkeletonPostCard from "./SkeletonPostCard";
import { POSTS_PER_PAGE } from "./usePostList";

function renderSkeletons(count) {
	return Array.from({ length: count }).map((_, i) => (
		<SkeletonPostCard key={`skeleton-${i}`} />
	));
}

export default function PostList({
	list,
	seriesId,
	volumeId,
	user,
	onDelete,
	onEdit,
	emptyMessage,
	label,
	icon,
	renderPill,
}) {
	const { posts, hasMore, loading, sort, setSort, loadMore } = list;

	return (
		<div className="posts-section">
			<div className="posts-section__header">
				<h2 className="posts-section__title">
					{icon}
					<span>{label}</span>
				</h2>
				{posts.length > 0 && (
					<span className="posts-section__count">
						{posts.length}
						{hasMore ? "+" : ""}
					</span>
				)}
			</div>

			<div className="posts-section__sort" role="tablist">
				<button
					className={`posts-section__sort-btn${sort === "top" ? " posts-section__sort-btn--active" : ""}`}
					onClick={() => setSort("top")}
				>
					Curtidos
				</button>
				<button
					className={`posts-section__sort-btn${sort === "recent" ? " posts-section__sort-btn--active" : ""}`}
					onClick={() => setSort("recent")}
				>
					Recentes
				</button>
			</div>

			{loading && posts.length === 0 ? (
				<div className="posts-list">{renderSkeletons(POSTS_PER_PAGE)}</div>
			) : posts.length === 0 ? (
				<p className="posts-section__empty">{emptyMessage}</p>
			) : (
				<div className="posts-list">
					{posts.map((post) => {
						const card = (
							<PostCard
								key={post._id}
								post={post}
								canDelete={user && user.username === post.author?.username}
								onDelete={onDelete}
								onEdit={onEdit}
								seriesId={post.context ? post.context.seriesId : seriesId}
								volumeId={post.context ? post.context.volumeId : volumeId}
							/>
						);
						if (!renderPill) return card;
						return (
							<div key={post._id} className="posts-list__item">
								{renderPill(post)}
								{card}
							</div>
						);
					})}
					{loading && renderSkeletons(POSTS_PER_PAGE)}
				</div>
			)}

			{hasMore && !loading && (
				<button className="button posts-section__more" onClick={loadMore}>
					Ver mais
				</button>
			)}
		</div>
	);
}
