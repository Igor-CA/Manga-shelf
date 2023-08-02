import { SeriesCard } from "../../components/SeriesCard"

export default function ProfilePage({userData}){
    return(
        <div className='collection-container'>
        {userData.map(series => {
          return(
            <SeriesCard key={series._id} seriesDetails={{title:series.title, image:series.image, id:series._id}} ></SeriesCard>
          )
        })}
      </div>
    )
}