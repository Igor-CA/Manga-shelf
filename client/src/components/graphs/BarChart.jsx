import { useNavigate } from "react-router-dom";
import { BarChart, Bar, Tooltip, ResponsiveContainer, XAxis } from "recharts";
import "./Charts.css";
const CustomTooltip = ({
	active,
	payload,
	label,
	total,
	categoryLabel,
	valueLabel,
	formatValue,
}) => {
	if (!active || !payload?.length) return null;

	const value = payload[0].value;
	if (value == null) return null;
	const name = label || "Não classificado";
	const share = total > 0 ? Math.round((value / total) * 100) : 0;

	return (
		<div className="bar-chart__tooltip">
			<p>{`${categoryLabel}: ${name}`}</p>
			<p>{`${valueLabel}: ${formatValue(value)}`}</p>
			{total > 0 && <p>{`${share}% do total`}</p>}
		</div>
	);
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
			pointerEvents="none"
		/>
	);
};

export default function BarChartComponent({
	chartTitle,
	data,
	total,
	filterParam,
	basePath,
	categoryLabel = "Gênero",
	valueLabel = "Quantidade",
	formatValue = (value) => value,
	minSlotWidth = 0,
}) {
	const navigate = useNavigate();
	const isClickable = Boolean(filterParam && basePath);
	const goToFiltered = (chartState) => {
		const name = chartState?.activeLabel;
		if (!isClickable || !name) return;
		navigate(`${basePath}?${new URLSearchParams({ [filterParam]: name })}`);
	};
	return (
		<div className="chart-container chart-container--grow">
			<div style={{ flexGrow: 1, minWidth: 0 }}>
				<p className="chart__title">{chartTitle}</p>
				<div className="pie-chart_container">
					{data.length > 0 ? (
						<div className="bar-chart__scroll">
							<div
								style={{ minWidth: data.length * minSlotWidth, height: "100%" }}
							>
								<ResponsiveContainer width="100%" height="100%">
									<BarChart
										data={data}
										onClick={goToFiltered}
										style={{ cursor: isClickable ? "pointer" : "default" }}
									>
										<Bar
											dataKey="count"
											className="bar-chart__bar"
											isAnimationActive={false}
											radius={[5, 5, 0, 0]}
										></Bar>
										<XAxis
											dataKey="name"
											tick={(props) => {
												const {
													verticalAnchor,
													visibleTicksCount,
													tickFormatter,
													...restProps
												} = props;
												return (
													<text
														{...restProps}
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
											content={
												<CustomTooltip
													total={total}
													categoryLabel={categoryLabel}
													valueLabel={valueLabel}
													formatValue={formatValue}
												/>
											}
										/>{" "}
									</BarChart>
								</ResponsiveContainer>
							</div>
						</div>
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
		</div>
	);
}
