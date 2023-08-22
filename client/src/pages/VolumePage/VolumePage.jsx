import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./VolumePage.css";

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

	useEffect(() => {
		const fetchVolumeData = async () => {
			try {
				const response = await axios.get(`${process.env.REACT_APP_HOST_ORIGIN}/api/volume/${id}`);
				const responseData = response.data;
				console.log(responseData);
				setVolumeData(responseData);
			} catch (error) {
				console.error("Error fetching Volume Data:", error);
			}
		};

		fetchVolumeData();
	}, []);

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
