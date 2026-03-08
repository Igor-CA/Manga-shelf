import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { UserContext } from "../../contexts/userProvider";
import ReviewCard from "../../components/ReviewCard";
import ReviewForm from "../../components/ReviewForm";

export default function SeriesReviewsPage({ series }) {
	const { id } = useParams();
	const { user } = useContext(UserContext);
	const [reviews, setReviews] = useState([]);
	const [userReview, setUserReview] = useState(null);
	const [showForm, setShowForm] = useState(false);
	const [loading, setLoading] = useState(true);

	const fetchReviews = async () => {
		try {
			const res = await axios({
				method: "GET",
				headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/data/series/${id}/reviews`,
			});
			setReviews(res.data);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const fetchUserReview = async () => {
		if (!user) return;
		try {
			const res = await axios({
				method: "GET",
				withCredentials: true,
				headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/review/${id}`,
			});
			setUserReview(res.data.review);
		} catch (error) {
			console.error(error);
		}
	};

	useEffect(() => {
		fetchReviews();
		fetchUserReview();
	}, [id, user]);

	const handleReviewSaved = () => {
		setShowForm(false);
		fetchReviews();
		fetchUserReview();
	};

	const handleDelete = async (reviewId) => {
		if (!window.confirm("Tem certeza que deseja excluir sua review?")) return;
		try {
			await axios({
				method: "DELETE",
				withCredentials: true,
				headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/review/${reviewId}`,
			});
			setUserReview(null);
			fetchReviews();
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<div className="container">
			<div className="content-overall__container">
				<div className="overall-content__container">
					<hr style={{ margin: "0px 10px" }} />
					<h2 className="collection-lable">Reviews</h2>
			<div className="reviews-page">
				{series && (
					<div className="reviews-page__rating-summary">
						<div className="rating-summary__score">
							{series.ratingAverage > 0
								? series.ratingAverage.toFixed(1)
								: "—"}
						</div>
						<div className="rating-summary__details">
							<span className="rating-summary__label">Nota média</span>
							<span className="rating-summary__count">
								{series.ratingCount || 0} avaliação(ões)
							</span>
						</div>
					</div>
				)}

				{user && !userReview && !showForm && (
					<button
						className="button reviews-page__write-btn"
						onClick={() => setShowForm(true)}
					>
						Escrever review
					</button>
				)}

				{showForm && (
					<ReviewForm
						seriesId={id}
						existingReview={userReview}
						onSaved={handleReviewSaved}
						onCancel={() => setShowForm(false)}
					/>
				)}

				{userReview && !showForm && (
					<div className="reviews-page__user-review">
						<h3>Sua review</h3>
						<ReviewCard review={{
							...userReview,
							user: { username: user.username, profileImageUrl: user.profileImageUrl },
						}} />
						<div className="reviews-page__user-actions">
							<button
								className="button"
								onClick={() => setShowForm(true)}
							>
								Editar
							</button>
							<button
								className="button button--red"
								onClick={() => handleDelete(userReview._id)}
							>
								Excluir
							</button>
						</div>
					</div>
				)}

				<hr />

				{loading ? (
					<p>Carregando reviews...</p>
				) : reviews.length === 0 ? (
					<p className="reviews-page__empty">
						Nenhuma review ainda. Seja o primeiro a avaliar!
					</p>
				) : (
					<div className="reviews-list">
						{reviews.map((review) => (
							<ReviewCard key={review._id} review={review} />
						))}
					</div>
				)}
			</div>
				</div>
			</div>
		</div>
	);
}
