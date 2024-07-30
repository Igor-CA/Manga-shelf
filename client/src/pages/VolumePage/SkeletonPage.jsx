export default function SkeletonPage() {
	return (
		<div className="volume">
			<div className="volume__cover-wrapper">
				<div className="series-card__image-container series-card__loader"></div>
				<div className="volume__main-info">
					<div className="volume__functions">
						<div className="button button--disabled">
							<strong>Ver coleção</strong>
						</div>
						<label
							htmlFor="have-volume-check-mark"
							className="button button--grow button--disabled"
						>
							Adicionar Volume
						</label>
						<input
							type="checkbox"
							name="have-volume-check-mark"
							id="have-volume-check-mark"
							className="checkmark invisible"
						/>
					</div>
				</div>
			</div>
			<div className="volume__info-container">
				<h1 className="volume__title series-card__loader">Titulo</h1>
				<ul className="volume__details-container">
					<li className="volume__details series-card__loader">
						Info
					</li>
					<li className="volume__details series-card__loader">
						Info
					</li>
					<li className="volume__details">
						<p className="series-card__loader">Sumario</p>
						<p className="series-card__loader">Sumario</p>
						<p className="series-card__loader">Sumario</p>
						<p className="series-card__loader">Sumario</p>
						<p className="series-card__loader">Sumario</p>
						<p className="series-card__loader">Sumario</p>
						<p className="series-card__loader">Sumario</p>
						<p className="series-card__loader">Sumario</p>
					</li>
				</ul>
			</div>
		</div>
	);
}
