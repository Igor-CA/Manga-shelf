import { useEffect, useRef, useState } from "react";
import ActionDropdown from "../customInputs/ActionsDropdown";
import "./contentHeader.css";
import ContentNavbar from "../navbars/ContentNavbar";
import SkeletonHeader from "../SkeletonHeader";
import { printArray } from "../../utils/seriesDataFunctions";

export default function ContentHeader({
	data,
	imageFilename,
	backgroundImageUrl,
	title,
	subtitle,
	authors,
	genres,
	isAdult,
	summary,
	actions,
	navLinks,
}) {
	const [showingMore, setShowingMore] = useState(false);
	const [loaded, setLoaded] = useState(false);
	const summaryRef = useRef(null);

	useEffect(() => {
		if (summaryRef.current) {
			setShowingMore(
				summaryRef.current.scrollHeight <= summaryRef.current.clientHeight,
			);
		}
	}, [data]);

	const handleLoading = () => {
		setLoaded(true);
	};

	if (!data) return <SkeletonHeader />;

	return (
		<header className="content-header">
			<div className="header__bg-image-container">
				<div
					style={{
						backgroundImage: `url('${backgroundImageUrl}')`,
					}}
					className="header__bg-image"
					role="img"
					aria-label="background-image"
				></div>
				<div className="banner-shade"></div>
			</div>
			<div className="container">
				<div className="header-container">
					<div className="header__art-container">
						<div className="header__cover-image-container">
							<img
								src={`${
									import.meta.env.REACT_APP_HOST_ORIGIN
								}/images/medium/${imageFilename}`}
								srcSet={
									`${
										import.meta.env.REACT_APP_HOST_ORIGIN
									}/images/small/${imageFilename} 100w,` +
									`${
										import.meta.env.REACT_APP_HOST_ORIGIN
									}/images/medium/${imageFilename} 400w,` +
									`${
										import.meta.env.REACT_APP_HOST_ORIGIN
									}/images/large/${imageFilename} 700w,` +
									`${
										import.meta.env.REACT_APP_HOST_ORIGIN
									}/images/extralarge/${imageFilename} 1000w,`
								}
								sizes=" (min-width: 768px) 360px, (max-width: 768px) 100vw,"
								loading="lazy"
								alt={`cover ${title}`}
								className={`header__cover-image ${
									!loaded && "header__cover-image--loading"
								}`}
								onLoad={handleLoading}
							/>
							{isAdult && (
								<div className="series-card__adult-indicator">+18</div>
							)}
						</div>
						<ActionDropdown
							mainAction={actions.mainAction}
							options={actions.dropdownOptions}
							isDisabled={actions.isDisabled}
						/>
					</div>
					<div className="header__main-info-container">
						<div className="header__title-container">
							<div>
								<h1 className="content-title">{title}</h1>
								{subtitle && <h2>{subtitle}</h2>}
							</div>
							{authors?.length > 0 && (
								<span className="content-author">
									Obra de: {printArray(authors)}
								</span>
							)}
						</div>
						<div className="header__secondary-info">
							<ul className="header__genres-list">
								{genres?.map((genre, index) => {
									return (
										<li className="header__genre-tag" key={index}>
											{genre}
										</li>
									);
								})}
							</ul>
						</div>
					</div>
				</div>

				{summary?.length > 0 && (
					<div className="content__details-summary">
						<strong>Sinopse:</strong>
						<div
							ref={summaryRef}
							className={`content__summary ${
								showingMore ? "content__summary--show-full" : ""
							}`}
						>
							{summary.map((paragraph, i) => (
								<p key={i}>{paragraph}</p>
							))}
						</div>
						{!showingMore && (
							<button
								className="show-more__button"
								aria-label="Mostrar mais"
								onClick={() => setShowingMore(true)}
							>
								Mostrar mais
							</button>
						)}
					</div>
				)}
			</div>
			{navLinks && <ContentNavbar links={navLinks} />}
		</header>
	);
}
