import {
	BarChart,
	Bar,
	Tooltip,
	ResponsiveContainer,
	XAxis,
} from "recharts";
const CustomTooltip = ({ active, payload, label, total }) => {
	if (active && payload && payload.length) {
		return (
			<div className="bar-chart__tooltip">
				<p>{`Gênero: ${label}`}</p>
				<p>{`Quantidade: ${payload[0].value} `}</p>
				<p>
					{Math.round((payload[0].value / total) * 100)}% das suas obras tem traços de {label}
				</p>
			</div>
		);
	}

	return null;
};
const CustomCursor = ({ x, y, width, height }) => {
	return (
		<rect
			x={x}
			y={y}
			width={width}
			height={height}
			fill="#8881"
			stroke="none"
		/>
	);
};

export default function BarChartComponent({ chartTitle, data, total }) {

	return (
		<div className="chart-container chart-container--grow">
			<div style={{ flexGrow: 1 }}>
				<p className="chart__title">{chartTitle}</p>
				<div className="pie-chart_container">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={data}>
							<Bar
								dataKey="count"
                                className="bar-chart__bar"
								isAnimationActive={false}
								radius={[5, 5, 0, 0]}
							></Bar>
							<XAxis
								dataKey="name"
								tick={(props) => {
									return (
										<text
											{...props}
											className="bar-chart__x_axis"
											textAnchor="middle"
											dominantBaseline="central"
											y={props.y + 5} // Fine-tune vertical position
										>
											{props.payload.value}
										</text>
									);
								}}
							/>
							<Tooltip
								cursor={<CustomCursor />}
								content={<CustomTooltip total={total} />}
							/>{" "}
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>
		</div>
	);
}
