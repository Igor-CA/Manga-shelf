import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
export default function UserSubmissionsPage() {
	const { username } = useParams();
	const [submissions, setSubmissions] = useState();

	useEffect(() => {
		fetchSubmissions();
	}, []);

	const fetchSubmissions = async () => {
		try {
			const response = await axios.get(
				`${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/${username}/submission`,
				{
					withCredentials: true,
					headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
				},
			);
			setSubmissions(response.data);
		} catch (error) {
			console.error("Erro ao buscar submissões", error);
		}
	};
	return (
		<div className="container">
			<h2 className="submission-page__header">Suas submissões</h2>
			{submissions && submissions.length > 0 ? (
				<ul className="submissions-container">
					{submissions.map((submission) => {
						return (
							<Submission
								key={submission._id}
								submission={submission}
							></Submission>
						);
					})}
				</ul>
			) : (
				<div className="no-submissions-message">
					Essa página é para que possa visualizar suas submissões de
					edições/adições de metadados em volume/coleções. Caso queira editar ou
					adicionar alguma informação basta ir na devida página do
					volume/coleção e clicar no botão "Editar Informações". As informações
					serão verificadas e ao serem aprovadas por um moderador ficarão
					disponíveis para todos visualizarem
				</div>
			)}
		</div>
	);
	i;
}

function Submission({ submission }) {
	const {
		type,
		cover,
		targetId,
		createdAt,
		targetModel,
		status,
		adminComment,
	} = submission;
	console.log(submission);
	function timeAgo(date) {
		const now = new Date();
		const givenDate = new Date(date);
		const diff = Math.floor((now - givenDate) / 1000); // Difference in seconds

		const intervals = [
			{ label: "ano", seconds: 31536000 },
			{ label: "mês", seconds: 2592000 },
			{ label: "semana", seconds: 604800 },
			{ label: "dia", seconds: 86400 },
			{ label: "hora", seconds: 3600 },
			{ label: "minuto", seconds: 60 },
			{ label: "segundo", seconds: 1 },
		];

		for (const interval of intervals) {
			const count = Math.floor(diff / interval.seconds);
			if (count >= 1) {
				if (interval.label === "mês" && count > 1)
					return `${count} meses atrás`;
				return `${count} ${interval.label}${count > 1 ? "s" : ""} atrás`;
			}
		}

		return "just now";
	}

	const time = timeAgo(createdAt);
	let statusStyle = "";
	if (status === "Rejeitado") {
		statusStyle = "submission__status--rejected";
	} else if (status === "Pendente") {
		statusStyle = "submission__status--pending";
	}
	return (
		<li className="submission" onClick={() => markAsSeen(id)}>
			<SubmissionImage
				imageUrl={cover}
				type={type}
				objectType={targetModel}
				associatedObject={targetId}
			></SubmissionImage>
			<div className="submission__content">
				<div className="submission__content__inner">
					<strong>
						{targetId.title || targetId.serie?.title}{" "}
						{targetId.number ? `Volume ${targetId.number}` : ""}
					</strong>
					<div className={`submission__status ${statusStyle}`}>{status}</div>
					{adminComment && (
						<p>
							<strong>Comentários do Mod:</strong> {adminComment}
						</p>
					)}
				</div>
				<div className="submission__date-container">
					<time className="notification-date" dateTime={createdAt}>
						{time}
					</time>
				</div>
			</div>
		</li>
	);
}
const SubmissionImage = ({ imageUrl, objectType, associatedObject }) => {
	const hostOrigin = import.meta.env.REACT_APP_HOST_ORIGIN;
	const pictureSRC = `${hostOrigin}/images`;
	let linkTo = "/";

	const getId = (obj) => obj?._id || obj;

	if (objectType === "Volume" && associatedObject) {
		linkTo = `/volume/${getId(associatedObject)}`;
	} else if (objectType === "Series" && associatedObject) {
		linkTo = `/series/${getId(associatedObject)}`;
	}

	let finalImageSrc = "";
	if (imageUrl) {
		finalImageSrc = `${pictureSRC}/small/${imageUrl}`;
	} else {
		finalImageSrc = `${pictureSRC}/default-cover.webp`; //
	}
	return (
		<Link to={linkTo} className={`submission-image-container`}>
			<img
				src={finalImageSrc}
				srcSet={
					imageUrl
						? `
								${pictureSRC}/small/${imageUrl} 100w,
								${pictureSRC}/medium/${imageUrl} 400w,
								${pictureSRC}/large/${imageUrl} 700w,
								${pictureSRC}/extralarge/${imageUrl} 1000w`
						: undefined
				}
				sizes={
					imageUrl
						? `
								(min-width: 1024px) 15vw,
								(min-width: 768px) 20vw,
								(min-width: 360px) and (max-width: 768px) 35vw,
								(max-width: 320px) 50vw`
						: undefined
				}
				altalt={`submission picture`}
				className="submission-image"
			/>
		</Link>
	);
};
