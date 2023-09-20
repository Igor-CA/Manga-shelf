import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../SeriesPage/SeriesPage.css"
export default function MissingVolumesPage({missingList}){
   

    const renderVolumeItem = (volume) => {
		const { series, volumeId, image, volumeNumber } = volume;
		return (
			<li className="series-card">
				<Link to={`/volume/${volumeId}`} className="series-card__image-container">
					<img src={image} alt={`cover of ${series}`} className="series-card__img" />
				</Link>
				<p className="series-card__title">{series} - {volumeNumber}</p>
			</li>
		);
	};

    return(
        <div className="container">
			<ol className="collection-container">
				{missingList.map((volume) => renderVolumeItem(volume))}
			</ol>
		</div>
    )
}