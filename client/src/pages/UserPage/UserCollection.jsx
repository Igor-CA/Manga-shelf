import { useNavigate, useParams } from "react-router-dom";
import SeriesCardList from "../../components/SeriesCardList";
import axios from "axios";

export default function UserCollection() {
	const { username } = useParams();
	const navigate = useNavigate();

	const querryUserList = async (page) => {
		try {
			const res = await axios({
				method: "GET",
				withCredentials: true,
				headers: {
					Authorization: process.env.REACT_APP_API_KEY,
				},
				params: {
					p: page,
				},
				url: `/api/data/user/${username}`,
			});
			const result = res.data;
			return result;
		} catch (error) {
			const errorType = error.response.status;
			if (errorType === 400) {
				navigate("/404");
			}
		}
	};
	return (
		<div className="user-collection container">
			<SeriesCardList
				skeletonsCount={36}
				fetchFunction={querryUserList}
			></SeriesCardList>
		</div>
	);
}
