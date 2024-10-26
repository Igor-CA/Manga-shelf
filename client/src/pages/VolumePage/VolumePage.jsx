import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./VolumePage.css";
import SkeletonPage from "../../components/SkeletonPage";
import VolumeInfoCard from "./VolumeInfoCard";

export default function VolumePage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [volumeData, setVolumeData] = useState();

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

	return (
		<div className="container page-content">
			{volumeData ? (
				<VolumeInfoCard volumeData={volumeData}></VolumeInfoCard>
			) : (
				<SkeletonPage></SkeletonPage>
			)}
		</div>
	);
}
