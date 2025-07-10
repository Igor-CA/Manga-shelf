import { useEffect, useState } from "react";
import PieChartComponent from "../../components/PieChart";
import { useParams } from "react-router-dom";
import axios from "axios";
import BarChartComponent from "../../components/BarChart";

export default function UserStatsPage() {
	const { username } = useParams();
	const [data, setData] = useState();
	useEffect(() => {
		const queryStats = async () => {
			try {
				const res = await axios({
					method: "GET",
					withCredentials: true,
					headers: {
						Authorization: import.meta.env.REACT_APP_API_KEY,
					},

					url: `${
						import.meta.env.REACT_APP_HOST_ORIGIN
					}/api/data/user/stats/${username}`,
				});
				const result = res.data;
				setData(result);
			} catch (error) {
				const errorType = error.response.status;
				console.log(error);
			}
		};
		queryStats();
	}, []);

	return (
		data && (
			<div className="container">
				<div className="stats__container">
					<div className="stats-highlights">
						<div className="stats-highlight">
							<div className="stats-highlight__value">{data.seriesCount}</div>
							<div className="stats-highlight__label">Obras diferentes</div>
						</div>
						<div className="stats-highlight">
							<div className="stats-highlight__value">{data.volumesCount}</div>
							<div className="stats-highlight__label">Volumes no total</div>
						</div>
						<div className="stats-highlight">
							<div className="stats-highlight__value">
								{data.wishListSeriesCount}
							</div>
							<div className="stats-highlight__label">
								Obras na lista de desejos
							</div>
						</div>
						<div className="stats-highlight">
							<div className="stats-highlight__value">
								{data.missingVolumesCount}
							</div>
							<div className="stats-highlight__label">Volumes Faltantes</div>
						</div>
					</div>
					<BarChartComponent
						chartTitle="Quantidade de coleções por gênero"
						total={data.seriesCount}
						data={data.genresBySeries}
					></BarChartComponent>
					<BarChartComponent
						chartTitle="Quantidade de volumes por gênero"
						total={data.volumesCount}
						data={data.genresByVolume}
					></BarChartComponent>
					<PieChartComponent
						chartTitle="Quantidade de coleções por editora"
						total={data.seriesCount}
						data={data.publisherBySeries}
					></PieChartComponent>
					<PieChartComponent
						chartTitle="Quantidade de volumes por editora"
						total={data.volumesCount}
						data={data.publisherByVolume}
					></PieChartComponent>
				</div>
			</div>
		)
	);
}
