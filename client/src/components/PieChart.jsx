import React from "react";
import {
	PieChart,
	Pie,
	Cell,
	Tooltip,
	ResponsiveContainer,
	BarChart,
	Bar,
} from "recharts";

const COLORS = [
	"#003A7D",
	//"#008DFF",
	//"#FF73B6",
	"#8B00B3",
	"#1F613A",
	"#E88C30",
	"#D83034",
];

//const COLORS = ["#003A7D", "#8B00B3", "#1F613A", "#EF8310", "#F9E858", "#D83034"];

const MAX_SHOW = 4;

export default function PieChartComponent({ chartTitle, data, total }) {
	const dataSize = data.reduce((sum, value) => sum + value.count, 0);
	return (
		<div className="chart-container">
			<div>
				<p className="chart__title">{chartTitle}</p>
				<div className="pie-chart_container">
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
										{ count: otherVal, name: "Outros" },
									];
									return list;
								})()}
								cx="50%"
								cy="50%"
								labelLine={false} // No label line for this layer
								outerRadius={100}
								fill="#8884d8"
								dataKey="count"
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
				</div>
			</div>
			{/*<BarChart width={300} height={100} data={data}>
					<Bar dataKey="count" fill="#8884d8">
						{data.map((entry, index) => (
							<Cell
								key={`cell-${index}`}
								fill={
									COLORS[
										index < COLORS.length
											? index % COLORS.length
											: COLORS.length - 1
									]
								}
							/>
						))}
					</Bar>
					<Tooltip />
				</BarChart>*/}
			<ol className="pie-chart__subtitle-container">
				{data.map((val, index) => {
					return (
						<li
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
							{val.name}: {val.count} ({Math.round((val.count / total) * 100)}
							%)
						</li>
					);
				})}
			</ol>
		</div>
	);
}
