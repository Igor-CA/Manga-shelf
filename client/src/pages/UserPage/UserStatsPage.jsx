import { useEffect, useState } from "react";
import PieChartComponent from "../../components/graphs/PieChart";
import { useParams } from "react-router-dom";
import axios from "axios";
import BarChartComponent from "../../components/graphs/BarChart";
import SkeletonStatsPage from "./SkeletonStatsPage";
import { formatCurrency } from "../../utils/formatters";
import CustomCheckbox from "../../components/customInputs/CustomCheckbox";

export default function UserStatsPage() {
	const { username } = useParams();
	const [data, setData] = useState();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [assumeCoverPrice, setAssumeCoverPrice] = useState(false);
	useEffect(() => {
		const queryStats = async () => {
			setLoading(true);
			setError(null);
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
				setError(error);
			} finally {
				setLoading(false);
			}
		};
		queryStats();
	}, [username]);

	if (loading) {
		return <SkeletonStatsPage />;
	}

	if (error) {
		return (
			<div className="container">
				<div className="no-submissions-message">
					Não foi possível carregar as estatísticas.
				</div>
			</div>
		);
	}

	if (!data || (data.seriesCount === 0 && data.wishListSeriesCount === 0)) {
		return (
			<div className="container">
				<div className="no-submissions-message">
					Você ainda não possui estatísticas para exibir.
				</div>
			</div>
		);
	}

	const collectionPath = `/user/${username}`;
	const isOwner = data.volumesWithPaidPrice !== undefined;
	const displayedSpent = assumeCoverPrice
		? data.totalSpent + data.coverValueOfVolumesWithoutPaidPrice
		: data.totalSpent;

	return (
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
					<div className="stats-highlight">
						<div className="stats-highlight__value">
							{formatCurrency(data.marketValue)}
						</div>
						<div className="stats-highlight__label">Valor de mercado</div>
						<div className="stats-highlight__note">
							{data.volumesWithCoverPrice} de {data.volumesCount} volumes
							com preço de capa no catálogo
						</div>
					</div>
					<div className="stats-highlight">
						<div className="stats-highlight__value">
							{formatCurrency(data.averageCoverPricePerVolume)}
						</div>
						<div className="stats-highlight__label">
							Preço médio por volume (preço de capa) 
						</div>
						<div className="stats-highlight__note">
							Média sobre os {data.volumesWithCoverPrice} volumes com preço de
							capa no catalogo
						</div>
					</div>
					{isOwner && (
						<>
							<div className="stats-highlight">
								<div className="stats-highlight__value">
									{formatCurrency(displayedSpent)}
								</div>
								<div className="stats-highlight__label">Total gasto</div>
								<div className="stats-highlight__note">
									{assumeCoverPrice
										? `${data.volumesCount} de ${data.volumesCount} volumes, assumindo preço de capa nos não registrados`
										: `${data.volumesWithPaidPrice} de ${data.volumesCount} volumes registrados`}
								</div>
								<div className="stats-highlight__toggle">
									<CustomCheckbox
										htmlId={"assume-cover-price"}
										label={"Assumir preço de capa nos volumes sem preço"}
										defaultValue={assumeCoverPrice}
										handleChange={(e) => setAssumeCoverPrice(e.target.checked)}
									></CustomCheckbox>
								</div>
							</div>
							<div className="stats-highlight">
								<div className="stats-highlight__value">
									{formatCurrency(data.averagePaidPricePerVolume)}
								</div>
								<div className="stats-highlight__label">
									Preço médio pago por volume
								</div>
								<div className="stats-highlight__note">
									Média sobre os {data.volumesWithPaidPrice} volumes registrados
								</div>
							</div>
						</>
					)}
				</div>
				<BarChartComponent
					chartTitle="Quantidade de coleções por gênero"
					total={data.seriesCount}
					data={data.genresBySeries}
					filterParam="genre"
					basePath={collectionPath}
				></BarChartComponent>
				<BarChartComponent
					chartTitle="Quantidade de volumes por gênero"
					total={data.volumesCount}
					data={data.genresByVolume}
					filterParam="genre"
					basePath={collectionPath}
				></BarChartComponent>
				{data.spendingBySeries?.length > 0 && (
					<BarChartComponent
						chartTitle="Gasto por obra (R$)"
						total={data.totalSpent}
						data={data.spendingBySeries}
						categoryLabel="Obra"
						valueLabel="Gasto"
						formatValue={formatCurrency}
					/>
				)}
				<PieChartComponent
					chartTitle="Quantidade de coleções por editora"
					total={data.seriesCount}
					data={data.publisherBySeries}
					filterParam="publisher"
					basePath={collectionPath}
				></PieChartComponent>
				<PieChartComponent
					chartTitle="Quantidade de volumes por editora"
					total={data.volumesCount}
					data={data.publisherByVolume}
					filterParam="publisher"
					basePath={collectionPath}
				></PieChartComponent>
				<PieChartComponent
					chartTitle="Demografia das suas coleções"
					total={data.seriesCount}
					data={data.demographicsBySeries}
					filterParam="demographic"
					basePath={collectionPath}
				></PieChartComponent>
				<PieChartComponent
					chartTitle="Demografia dos seus volumes"
					total={data.volumesCount}
					data={data.demographicsByVolume}
					filterParam="demographic"
					basePath={collectionPath}
				></PieChartComponent>
				<PieChartComponent
					chartTitle="Tipo de publicação (por obra)"
					total={data.seriesCount}
					data={data.typeBySeries}
					filterParam="type"
					basePath={collectionPath}
				></PieChartComponent>
				<PieChartComponent
					chartTitle="Tipo de publicação (por volume)"
					total={data.volumesCount}
					data={data.typeByVolume}
					filterParam="type"
					basePath={collectionPath}
				></PieChartComponent>
			</div>
		</div>
	);
}
