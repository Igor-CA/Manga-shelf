import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./VolumePage.css";
import SkeletonPage from "../../components/SkeletonPage";
import VolumeInfoCard from "./VolumeInfoCard";
import { UserContext } from "../../components/userProvider";

export default function VolumePage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [volumeData, setVolumeData] = useState();
	const { user, isFetching } = useContext(UserContext);
	useEffect(() => {
		if ((!isFetching && volumeData) &&  volumeData?.serie?.isAdult && !user?.allowAdult) {
			console.log(!isFetching, !volumeData?.serie?.isAdult, !user?.allowAdult);
			navigate("/");
		}
	}, [volumeData, isFetching, user, navigate]);

	useEffect(() => {
		const fetchVolumeData = async () => {
			try {
				const response = await axios.get(
					`${
						import.meta.env.REACT_APP_HOST_ORIGIN
					}/api/data/volume/${id}`,
					{
						headers: {
							Authorization: import.meta.env.REACT_APP_API_KEY,
						},
					}
				);
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
	}, [id, navigate]);

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
