import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
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
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				params: {
					p: page,
				},
				url: `${
					import.meta.env.REACT_APP_HOST_ORIGIN
				}/api/data/user/${username}/missing`,
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

	const EmptyListComponent = () => {
		return (
			<p className="not-found-message">
				Esta conta não possuí nenhum volume faltando. Talvez seja a hora de
				começar uma nova coleção?
				<Link to={"/browse"}>
					<strong>Busque novos títulos na nossa página de pesquisa</strong>
				</Link>{" "}
			</p>
		);
	};

	return (
		<div className="container">
			<SeriesCardList
				skeletonsCount={36}
				fetchFunction={fetchMissingVolumes}
				itemType="Volumes"
				errorComponent={EmptyListComponent}
				showActions={true}
			></SeriesCardList>
		</div>
	);
}
