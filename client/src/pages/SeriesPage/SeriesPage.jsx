import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./SeriesPage.css"
import { UserContext } from "../../components/userProvider";
import axios from "axios";

export default function SeriesPage(){
    const {id} = useParams()
    const [user, setUser] = useContext(UserContext)
    const [series, setSeries] = useState({
        title: '',
        publisher: '',
        seriesCover: '',
        authors: [],
        volumes: []
    })
    
    useEffect(() => {
        const fetchUserData = async () => {
            const hostOrigin = process.env.REACT_APP_HOST_ORIGIN
            try {
                const response = await axios.get(`${hostOrigin}/api/series/${id}`)
                console.log(response)
                const responseData = response.data;
                setSeries(responseData);
            } catch (error) {
                console.error('Error fetching Series Data:', error);
            }
        };

        fetchUserData();
    }, []);

    const getAuthorsString = (authors) => {
        const authorsList = authors.map((author, index) => {
            if(authors.length === (index+1)) return `${author}`
            else if(authors.length-1 === (index+1)) return `${author} e `
            return `${author}, `
        })
        return authorsList
    }

    const handleAddShow = async() => {
        try{
            const response = await axios({
                method: "POST",
                data: {id},
                withCredentials: true,
                url: "http://localhost:3001/user/add"
            })
            setUser()
            console.log(response)
        }catch(err){
            console.log(err)
        }
    }
    const handleRemoveShow = async() => {
        try{
            const response = await axios({
                method: "POST",
                data: {id},
                withCredentials: true,
                url: "http://localhost:3001/user/remove"
            })
            console.log(response)
            setUser()
        }catch(err){
            console.log(err)
        }
    }

    const renderButton = () => {
        const inList = user.userList.find(series => series.Series === id )
        console.log(inList)
        return (!inList)?
            <button className="add-button" onClick={handleAddShow}>Add Series</button>:
            <button className="add-button" onClick={handleRemoveShow}>Remove Series</button>
    }

    const {seriesCover, title, publisher, authors, volumes, } = series

    return(
        <div className="series">
            <div className="series__info-container">
                <img src={seriesCover} alt={`cover volume ${title}`} className="series__cover" />
                <div className="series_details-container">
                    <h1 className="series__details">{title}</h1>
                    <p  className="series__details"><strong>Editora:</strong> {publisher}</p>
                    <p className="series__details"><strong>Autores:</strong> {getAuthorsString(authors)}</p>
                    {user && renderButton()}
                </div>
            </div>
            <ol className="series__volumes-container">
                {volumes.map(volume => {
                    return(
                        <li key={volume.volumeId} className="series__volume-item">
                            <img src={volume.image} alt={`cover volume ${volume.volumeNumber}`} className="series__volume__image" />
                            <Link to={`../volume/${volume.volumeId}`} className="series__volume__number"><strong>Volume {volume.volumeNumber}</strong></Link>
                            <div>
                                <label htmlFor="have-volume-check-mark" className="checkmark-label">Tem:</label>
                                <input type="checkbox" name="have-volume-check-mark" className="checkmark"/>
                            </div>                
                        </li>
                    )
                })}
            </ol>
        </div>
    )

}