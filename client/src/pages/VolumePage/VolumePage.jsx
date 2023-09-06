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


	const addOrRemoveVolume = async (isAdding, completePorcentage) => {
		try {
			const url = isAdding
				? `${process.env.REACT_APP_HOST_ORIGIN}/user/add-volume`
				: `${process.env.REACT_APP_HOST_ORIGIN}/user/remove-volume`;

			const response = await axios({
				method: "POST",
				data: {
					idList: [id],
					completePorcentage,
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
		//Complete porcentage gonna be wrong
		addOrRemoveVolume(adding, 1);
	};

	const { image, serie, number, date, pagesNumber, summary } = volumeData;

	return (
		<div className="volume">
			<div className="volume__main-container">
				<img
					src={image}
					alt={`cover ${serie.title} volume ${number}`}
					className="volume__cover"
				/>
				<div className="volume_details-container">
					<h1 className="volume__details">
						{serie.title} Volume {number}
					</h1>
					<p className="volume__details">
						<strong>Data de publicação:</strong> {date}
					</p>
					<p className="volume__details">
						<strong>Páginas:</strong> {pagesNumber}
					</p>
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
					<div key={id} className="add-button">
						<Link
							to={`../series/${serie.id}`}
							className="series__volume__number"
						>
							<strong>See Series page</strong>
						</Link>
					</div>
				</div>
			</div>
			<div className="volume__details">
				<strong>Sinopse:</strong>
				{summary.map((paragraph, index) => {
					return (
						<p className="volume__summary" key={index}>
							{paragraph}
						</p>
					);
				})}
			</div>
		</div>
	);
}
