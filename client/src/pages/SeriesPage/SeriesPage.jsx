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
        const inList = user.userList.find(series => series.Series.id === id )
        return (!inList)?
            <button className="add-button" onClick={handleAddShow}>Add Series</button>:
            <button className="add-button" onClick={handleRemoveShow}>Remove Series</button>
    }

    const calculateCompletePorcentage = (newVolume) => {
        const correctionValue = (newVolume)? -1 : 1
        const total = series.volumes.length
        const ownedVolumes = series.volumes.filter((volume) => checkOwnedVolumes(volume.volumeId)).length + correctionValue
        return (ownedVolumes/total)
    }

    const checkOwnedVolumes = (id) => {
        if(user){
            const inList = user.ownedVolumes.includes(id);
            return inList
        }else{
            return false
        }
    }

    const handleChange = (e, id) => {
        const previousValue = !(e.target.checked);
        const completePorcentage = calculateCompletePorcentage(previousValue);
        (previousValue)?removeVolume(id, completePorcentage):addVolume(id, completePorcentage);
    }

    const addVolume = async(volumeId, completePorcentage) => {
        try{
            const response = await axios({
                method: "POST",
                data: {_id: volumeId, completePorcentage, seriesId: id},
                withCredentials: true,
                url: "http://localhost:3001/user/add-volume"
            })
            setUser()
            console.log(response)
        }catch(err){
            console.log(err)
        }
    }

    const removeVolume = async(volumeId, completePorcentage) => {
        try{
            const response = await axios({
                method: "POST",
                data: {_id: volumeId, completePorcentage, seriesId: id},
                withCredentials: true,
                url: "http://localhost:3001/user/remove-volume"
            })
            setUser()
            console.log(response)
        }catch(err){
            console.log(err)
        }
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
                    const {volumeId, image, volumeNumber} = volume
                    const ownsVolume = checkOwnedVolumes(volumeId)
                    return(
                        <li key={volumeId} className="series__volume-item">
                            <img src={image} alt={`cover volume ${volumeNumber}`} className="series__volume__image" />
                            <Link to={`../volume/${volumeId}`} className="series__volume__number"><strong>Volume {volumeNumber}</strong></Link>
                            <div>
                                <label htmlFor="have-volume-check-mark" className="checkmark-label">Tem:</label>
                                <input 
                                    type="checkbox" 
                                    name="have-volume-check-mark" 
                                    className="checkmark"
                                    checked={ownsVolume}
                                    onChange={(e) => {handleChange(e, volumeId)}}
                                />
                            </div>                
                        </li>
                    )
                })}
            </ol>
        </div>
    )

}