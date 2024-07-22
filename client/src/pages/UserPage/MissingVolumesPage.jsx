import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "../SeriesPage/SeriesPage.css";
import SeriesCardList from "../../components/SeriesCardList";
export default function MissingVolumesPage() {
	const { username } = useParams();
	const navigate = useNavigate();

	const fetchMissingVolumes = async (page) => {
		try {
			const response = await axios({
				method: "GET",
				withCredentials: true,
				headers: {
					Authorization: process.env.REACT_APP_API_KEY,
				},
				params: {
					p: page,
				},
				url: `/api/data/user/${username}/missing`,
			});
			const responseData = response.data;
			return responseData;
		} catch (error) {
			const errorType = error.response.status;
			if (errorType === 400) {
				navigate("/404");
			}
			console.error(
				"Error fetching Missing volumes data:",
				error.response.data.msg
			);
		}
	};

	return (
		<div className="container">
			<SeriesCardList
				skeletonsCount={36}
				fetchFunction={fetchMissingVolumes}
				itemType="Volumes"
			></SeriesCardList>
		</div>
	);
}
