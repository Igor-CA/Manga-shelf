import "./SeriesCard.css"
import { Link } from "react-router-dom";

export function SeriesCard({seriesDetails}){
    const {title, image, id}  = seriesDetails
    return(
        <Link to={`series/${id}`} className="series-card">
            <div className="series-card__overlay">
                <strong className="series-card__title">{title}</strong>
            </div>
            <img 
                src={image} 
                alt={`cover ${title}`}
                className="series-card__img"
            ></img>
        </Link>
    )
}