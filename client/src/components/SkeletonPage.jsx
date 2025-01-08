
import "../components/SeriesCard.css";
import "../pages/VolumePage/VolumePage.css";
export default function SkeletonPage({ type = "Volume" }) {
	return (
		<div className="volume">
			<div className="volume__cover-wrapper">
				<div className="series-card__image-container series-card__loader"></div>
				<div className="volume__main-info">
					<div className="volume__functions">
						<div className="button button--disabled">
							<strong>
								{type === "Volume"
									? "Ver coleção"
									: "Adicionar todos"}
							</strong>
						</div>
						<label
							htmlFor="have-volume-check-mark"
							className="button button--grow button--disabled"
						>
							{type === "Volume"
								? "Adicionar Volume"
								: "Adicionar coleção"}
						</label>
						<input
							type="checkbox"
							name="have-volume-check-mark"
							id="have-volume-check-mark"
							className="checkmark invisible"
						/>
					</div>
					{type === "Series" && (
						<div className="series__mobile-options-container">
							<div className='series__mobile-options series__mobile-options--selected'>Detalhes</div>
							<div className='series__mobile-options'>Volumes</div>
						</div>
					)}
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
