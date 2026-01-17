import { Suspense, useContext, useEffect, useState } from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import VolumeInfoCard from "./VolumeInfoCard";
import { UserContext } from "../../contexts/userProvider";

import "../SeriesPage/SeriesPage.css";
import { LoadingPageComponent } from "../../App";
import VolumesOverallPage from "./VolumesOverallPage";
export default function VolumePage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [volumeData, setVolumeData] = useState();
	const { user, isFetching } = useContext(UserContext);
	useEffect(() => {
		if (
			!isFetching &&
			volumeData &&
			volumeData?.serie?.isAdult &&
			!user?.allowAdult
		) {
			if (!isFetching && !user?.allowAdult && volumeData?.serie?.isAdult) {
				navigate("/adult-block");
			}
		}
	}, [volumeData, isFetching, user, navigate]);

	useEffect(() => {
		const fetchVolumeData = async () => {
			try {
				const response = await axios.get(
					`${import.meta.env.REACT_APP_HOST_ORIGIN}/api/data/volume/${id}`,
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
		<div className="page-content">
			<VolumeInfoCard volumeData={volumeData}></VolumeInfoCard>
			{volumeData && (
				<Suspense fallback={<LoadingPageComponent />}>
					<Routes>
						<Route
							path=""
							element={<VolumesOverallPage volume={volumeData} />}
						></Route>
					</Routes>
				</Suspense>
			)}
		</div>
	);
}
