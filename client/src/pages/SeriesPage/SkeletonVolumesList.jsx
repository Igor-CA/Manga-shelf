export default function SkeletonVolumesList({ count }) {
	return (
		<>
			{Array(count)
				.fill()
				.map((_, id) => {
					return (
						<div className="series-card" key={id}>
							<div className="series-card__image-container series-card__loader">
								<div className="series-card__img"></div>
							</div>
						</div>
					);
				})}
		</>
	);
}   
