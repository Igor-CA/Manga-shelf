import "./SeriesPageRedesign.css";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import { Suspense, useContext, useEffect, useState } from "react";
import { UserContext } from "../../components/userProvider";
import axios from "axios";
import SeriesPageHeader from "./SeriesPageHeader";
import { LoadingPageComponent } from "../../App";
import SeriesOverallPage from "./SeriesOverallPage";
export default function SeriesPageRedesign() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { user, isFetching } = useContext(UserContext);
	const [series, setSeries] = useState();

	useEffect(() => {
		const fetchSeriesData = async () => {
			try {
				const response = await axios.get(
					`${import.meta.env.REACT_APP_HOST_ORIGIN}/api/data/series/${id}`,
					{
						withCredentials: true,
						headers: {
							Authorization: import.meta.env.REACT_APP_API_KEY,
						},
					}
				);
				const responseData = response.data;
				setSeries(responseData);
			} catch (error) {
				const errorType = error.response.status;
				if (errorType === 400) {
					navigate("/404");
				}
				console.error("Error fetching Series Data:", error);
			}
		};

		fetchSeriesData();
	}, [id, navigate]);

	useEffect(() => {
		if (!isFetching && !user?.allowAdult && series?.isAdult) {
			navigate("/");
		}
	}, [isFetching, user, navigate, series]);
	return (
		<div className="page-content" key={id}>
			{series && (
				<>
					<SeriesPageHeader seriesInfo={series}></SeriesPageHeader>
					<Suspense fallback={<LoadingPageComponent />}>
						<Routes>
							<Route
								path=""
								element={<SeriesOverallPage series={series} />}
							></Route>
						</Routes>
					</Suspense>
				</>
			)}
		</div>
	);
}
