import { Suspense, useContext, useEffect, useState } from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { UserContext } from "../../contexts/userProvider";

import "../SeriesPage/SeriesPage.css";
import { LoadingPageComponent } from "../../App";
import VolumesOverallPage from "./VolumesOverallPage";
import VolumeHeader from "./VolumePageHeader";
import PostsSection from "../../components/posts/PostsSection";
import { useRating } from "../../utils/useRating";
import usePageMeta, { truncate } from "../../utils/usePageMeta";
export default function VolumePage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [volumeData, setVolumeData] = useState();
	const { user, isFetching } = useContext(UserContext);

	const volumeTitle = volumeData
		? `${volumeData.serie?.title} - Volume ${volumeData.number}`
		: null;
	usePageMeta(
		volumeTitle,
		volumeData
			? truncate(volumeData.summary?.[0]) ||
					`Detalhes do volume ${volumeData.number} de ${volumeData.serie?.title}: capa, sinopse, ISBN e data de lançamento no Brasil.`
			: null,
	);

	const rating = useRating({
		seriesId: volumeData?.serie?._id?.toString(),
		volumeId: id,
		manualScore: volumeData?.myVolumeScore ?? null,
		derivedScore: null,
		average: volumeData?.ratingAverage ?? 0,
		count: volumeData?.ratingCount ?? 0,
	});
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
						withCredentials: true,
						headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
					},
				);
				const responseData = response.data;
				setVolumeData(responseData);
			} catch (error) {
				const errorType = error.response?.status;
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
			<VolumeHeader volumeData={volumeData} rating={rating}></VolumeHeader>
			{volumeData && (
				<Suspense fallback={<LoadingPageComponent />}>
					<Routes>
						<Route
							path="comments"
							element={
								<PostsSection
									seriesId={volumeData.serie._id}
									volumeId={id}
									rating={rating}
								/>
							}
						></Route>
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
