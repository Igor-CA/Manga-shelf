import { RiArrowDropDownLine } from "react-icons/ri";

export default function SkeletonHeader() {
	return (
		<div className="content-header">
			<div className="header__bg-image-container">
				<div className="header__bg-image loader-animation"></div>
			</div>
			<div className="container">
				<div className="header-container">
					<div className="header__art-container">
						<div className={`header__cover-image-container loader-animation`} />
						<div className="button-select__container">
							<div className="button-select button-select--disabled">
								<strong className="button-select__option">
									Carregando...	
								</strong>
								<div className="button-select__dropdown">
									<RiArrowDropDownLine />
								</div>
							</div>
						</div>
					</div>
					<div className="header__main-info-container">
						<div className="header__title-container">
							<h1 className="content-title loader-animation">
								Carregando Titulo
							</h1>
							<span className="content-author loader-animation">
								Obra de: Carregando autores
							</span>
						</div>
						<div className="header__secondary-info">
							<ul className="header__genres-list"></ul>
						</div>
					</div>
				</div>

				<div className="content__details-summary">
					<p className="content__summary loader-animation">
						Carregando sinopse
					</p>
					<p className="content__summary loader-animation">
						Carregando sinopse
					</p>
					<p className="content__summary loader-animation">
						Carregando sinopse
					</p>
					<p className="content__summary loader-animation">
						Carregando sinopse
					</p>
					<p className="content__summary loader-animation">
						Carregando sinopse
					</p>
				</div>
			</div>
		</div>
	);
}
