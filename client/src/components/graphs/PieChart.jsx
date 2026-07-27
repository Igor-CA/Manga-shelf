import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = [
	"#003A7D",
	//"#008DFF",
	//"#FF73B6",
	"#8B00B3",
	"#1F613A",
	"#E88C30",
	"#D83034",
];

const MAX_SHOW = 4;

const OTHERS_LABEL = "Outros";

export default function PieChartComponent({
	chartTitle,
	data,
	total,
	filterParam,
	basePath,
}) {
	const navigate = useNavigate();
	const getPercentageString = (count, total) => {
		const percentage = Math.round((count / total) * 100);
		if (percentage < 1) {
			return "< 1";
		}
		return percentage;
	};
	const buildLink = (name) => {
		if (!filterParam || !basePath || !name || name === OTHERS_LABEL) return null;
		return `${basePath}?${new URLSearchParams({ [filterParam]: name })}`;
	};
	return (
		<div className="chart-container">
			<div>
				<p className="chart__title">{chartTitle}</p>
				<div className="pie-chart_container">
					{data.length > 0 ? (
						<ResponsiveContainer width="100%" height="80%">
							<PieChart width="100%" height="100%">
								<Pie
									data={(() => {
										if (data.length <= MAX_SHOW) {
											return data;
										}
										const otherVal = data
											.slice(MAX_SHOW)
											.reduce((sum, value) => sum + value.count, 0);
										const list = [
											...data.slice(0, MAX_SHOW),
											{ count: otherVal, name: OTHERS_LABEL },
										];
										return list;
									})()}
									cx="50%"
									cy="50%"
									labelLine={false} // No label line for this layer
									outerRadius={100}
									fill="#8884d8"
									dataKey="count"
									stroke={data.length > 1 ? "var(--foreground)" : "none"} // Use a white stroke only when there's more than one slice
									cursor={filterParam ? "pointer" : "default"}
									onClick={(entry) => {
										const link = buildLink(entry?.name);
										if (link) navigate(link);
									}}
								>
									{/* Render count at the center */}
									{data.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={COLORS[index % COLORS.length]}
										/>
									))}
								</Pie>
								<Tooltip />
							</PieChart>
						</ResponsiveContainer>
					) : (
						<div className="empty-graph-message-container">
							<p className="empty-graph-message">
								Sem informações o suficiente para calcular esse grafico.
								Adicione mais obras e volte mais tarde
							</p>
						</div>
					)}
				</div>
			</div>
			<ol className="pie-chart__subtitle-container">
				{data.map((val, index) => {
					const link = buildLink(val.name);
					const label = `${val.name || "Não classificados"}: ${
						val.count
					} (${getPercentageString(val.count, total)}%)`;
					return (
						<li
							key={index}
							className="pie-chart__subtitle"
							style={{
								backgroundColor:
									COLORS[
										index < COLORS.length
											? index % COLORS.length
											: COLORS.length - 1
									],
							}}
						>
							{link ? (
								<Link
									to={link}
									className="pie-chart__subtitle-link"
									title={`Ver as obras de ${val.name} na coleção`}
								>
									{label}
								</Link>
							) : (
								label
							)}
						</li>
					);
				})}
			</ol>
		</div>
	);
}
