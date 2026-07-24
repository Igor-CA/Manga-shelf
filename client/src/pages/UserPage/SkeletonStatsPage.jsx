export default function SkeletonStatsPage() {
	return (
		<div className="container">
			<div className="stats__container">
				<div className="stats-highlights">
					{Array(4)
						.fill()
						.map((_, id) => (
							<div
								key={id}
								className="stats-highlight--skeleton loader-animation"
							></div>
						))}
				</div>
				<div className="chart-container chart-container--grow">
					<div className="chart-container__skeleton-box loader-animation"></div>
				</div>
				<div className="chart-container chart-container--grow">
					<div className="chart-container__skeleton-box loader-animation"></div>
				</div>
				{Array(6)
					.fill()
					.map((_, id) => (
						<div key={id} className="chart-container">
							<div className="chart-container__skeleton-box loader-animation"></div>
						</div>
					))}
			</div>
		</div>
	);
}
