import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./VolumePage.css";
import { UserContext } from "../../components/userProvider";

export default function VolumePage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [volumeData, setVolumeData] = useState({
		serie: {
			title: "",
		},
		number: "",
		summary: [],
		date: "",
		defaultPrice: 0,
		pagesNumber: "",
		image: "",
	});

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth < 768) {
				const mainInfo = document.querySelector(".volume__main-info");
				const image = document.querySelector(".volume__cover");
				const contentComponent = document.querySelector(
					".volume__info-container"
				);

				const contentTop = `calc(${mainInfo.offsetHeight}px + ${
					image.offsetHeight * 0.6
				}px)`;
				contentComponent.style.top = contentTop;

				const footer = document.querySelector(".footer");
				const content = document.querySelector(".series__content");

				footer.style.position = "absolute";
				footer.style.top = `calc(${
					mainInfo.offsetHeight + contentComponent.offsetHeight
				}px + ${image.offsetHeight * 0.6}px)`;

				return () => {
					window.removeEventListener("resize", handleResize);
					const footer = document.querySelector(".footer");
					footer.style = null;
				};
			}
		};
		handleResize();
		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
			const footer = document.querySelector(".footer");
			footer.style = null;
		};
	}, [volumeData]);

	const { user, setOutdated } = useContext(UserContext);
	useEffect(() => {
		const fetchVolumeData = async () => {
			try {
				const response = await axios.get(`/api/data/volume/${id}`, {
					headers: {
						Authorization: process.env.REACT_APP_API_KEY,
					},
				});
				const responseData = response.data;
				setVolumeData(responseData);
			} catch (error) {
				const errorType = error.response.status;
				if (errorType === 400) {
					navigate("/404");
				}
				console.error("Error fetching Volume Data:", error);
			}
		};

		fetchVolumeData();
	}, []);

	const checkOwnedVolume = () => {
		if (user) {
			return user.ownedVolumes.includes(id);
		}
		return false;
	};

	const addOrRemoveVolume = async (isAdding) => {
		try {
			const url = isAdding ? `/api/user/add-volume` : `/api/user/remove-volume`;

			const amoutVolumesFromSeries = volumeData.serie.volumes.length;
			const response = await axios({
				method: "POST",
				data: {
					idList: [id],
					amoutVolumesFromSeries,
					seriesId: volumeData.serie.id,
				},
				headers: {
					Authorization: process.env.REACT_APP_API_KEY,
				},
				withCredentials: true,
				url: url,
			});
			setOutdated(true);
		} catch (err) {
			console.log(err);
		}
	};

	const handleChange = (e) => {
		const adding = e.target.checked;
		addOrRemoveVolume(adding);
	};

	const { image, serie, number, defaultPrice, pagesNumber, summary } =
		volumeData;

	return (
		<div className="volume container page-content">
			<div className="volume__cover-wrapper">
				<img
					src={image}
					alt={`cover ${serie.title} volume ${number}`}
					className="volume__cover"
				/>

				<div className="volume__main-info">
					<div className="volume__functions">
						<Link to={`/series/${serie.id}`} className="button">
							<strong>Ver coleção</strong>
						</Link>
						<label
							htmlFor="have-volume-check-mark"
							className={`button button--grow button--${
								user && checkOwnedVolume() ? "red" : "green"
							}`}
						>
							<strong>
								{user && checkOwnedVolume()
									? "Remover volume"
									: "Adicionar Volume"}
							</strong>
						</label>
						<input
							type="checkbox"
							name="have-volume-check-mark"
							id="have-volume-check-mark"
							className="checkmark invisible"
							disabled={user ? false : true}
							checked={user && checkOwnedVolume()}
							onChange={(e) => {
								handleChange(e);
							}}
						/>
					</div>
					<h1 className="volume__title">
						{serie.title} Volume {number}
					</h1>
				</div>
			</div>
			<div className="volume__info-container">
				<ul className="volume__details-container">
					{pagesNumber && (
						<li className="volume__details">
							<strong>Páginas:</strong> {pagesNumber}
						</li>
					)}
					{defaultPrice && (
						<li className="volume__details">
							<strong>Preço:</strong> R$ {defaultPrice}
						</li>
					)}
					{summary && (
						<li className="volume__details">
							<strong>Sinopse:</strong>
							{summary.map((paragraph, index) => {
								return (
									<p className="volume__summary" key={index}>
										{paragraph}
									</p>
								);
							})}
						</li>
					)}
				</ul>
			</div>
		</div>
	);
}
