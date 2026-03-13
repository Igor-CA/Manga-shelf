import { useEffect, useState } from "react";
import PieChartComponent from "../../components/graphs/PieChart";
import { useParams } from "react-router-dom";
import axios from "axios";
import BarChartComponent from "../../components/graphs/BarChart";

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

	const formatCurrency = (value) =>
		value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
						{data.totalSpent > 0 && (
							<>
								<div className="stats-highlight">
									<div className="stats-highlight__value">
										{formatCurrency(data.totalSpent)}
									</div>
									<div className="stats-highlight__label">Total gasto</div>
								</div>
								<div className="stats-highlight">
									<div className="stats-highlight__value">
										{formatCurrency(data.averagePricePerVolume)}
									</div>
									<div className="stats-highlight__label">
										Preço médio por volume
									</div>
								</div>
							</>
						)}
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
					<PieChartComponent
						chartTitle="Demografia das suas coleções"
						total={data.seriesCount}
						data={data.demographicsBySeries}
					></PieChartComponent>
					<PieChartComponent
						chartTitle="Demografia dos seus volumes"
						total={data.volumesCount}
						data={data.demographicsByVolume}
					></PieChartComponent>
					<PieChartComponent
						chartTitle="Tipo de publicação (por obra)"
						total={data.seriesCount}
						data={data.typeBySeries}
					></PieChartComponent>
					<PieChartComponent
						chartTitle="Tipo de publicação (por volume)"
						total={data.volumesCount}
						data={data.typeByVolume}
					></PieChartComponent>
				{data.spendingBySeries?.length > 0 && (
						<BarChartComponent
							chartTitle="Gasto por obra (R$)"
							total={data.totalSpent}
							data={data.spendingBySeries}
						/>
					)}
				</div>
			</div>
		)
	);
}
