import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import "./VolumePage.css";
import { UserContext } from "../../components/userProvider";

export default function VolumePage() {
	const { id } = useParams();
	const [volumeData, setVolumeData] = useState({
		serie: {
			title: "",
		},
		number: "",
		summary: [],
		date: "",
		pagesNumber: "",
		image: "",
	});
	const { user, setOutdated } = useContext(UserContext);
	useEffect(() => {
		const fetchVolumeData = async () => {
			try {
				const response = await axios.get(
					`${process.env.REACT_APP_HOST_ORIGIN}/api/volume/${id}`
				);
				const responseData = response.data;
				console.log(responseData);
				setVolumeData(responseData);
			} catch (error) {
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
			const url = isAdding
				? `${process.env.REACT_APP_HOST_ORIGIN}/user/add-volume`
				: `${process.env.REACT_APP_HOST_ORIGIN}/user/remove-volume`;

			const amoutVolumesFromSeries = volumeData.serie.volumes.length;
			const response = await axios({
				method: "POST",
				data: {
					idList: [id],
					amoutVolumesFromSeries,
					seriesId: volumeData.serie.id,
				},
				withCredentials: true,
				url: url,
			});
			setOutdated(true);
			//console.log("RESPONSE:", response);
		} catch (err) {
			console.log(err);
		}
	};

	const handleChange = (e) => {
		const adding = e.target.checked;
		addOrRemoveVolume(adding);
	};

	const { image, serie, number, defaultPrice, pagesNumber, summary } = volumeData;

	return (
		<div className="volume">
			<img
				src={image}
				alt={`cover ${serie.title} volume ${number}`}
				className="volume__cover"
			/>
			<div className="volume_info-container">
				<div className="volume__functions">
					<Link to={`../series/${serie.id}`} className="volume__series-button">
						<strong>See Series page</strong>
					</Link>

					<label htmlFor="have-volume-check-mark" className="checkmark-label">
						Tem:
					</label>
					<input
						type="checkbox"
						name="have-volume-check-mark"
						className="checkmark"
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
				<ul className="volume__details-container">
					<li className="volume__details"><strong>Pages:</strong> {pagesNumber}</li>
					<li className="volume__details"><strong>Price:</strong> R$ {defaultPrice}</li>
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
				</ul>
			</div>
		</div>
	);
}
