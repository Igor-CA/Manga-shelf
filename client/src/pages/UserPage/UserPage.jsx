import { useContext, useState, useEffect } from "react"
import { Link } from "react-router-dom";
import { UserContext } from "../../components/userProvider";
import UserCollection from "../../components/UserCollection";
import BrowseDisplay from "../../components/BrowseDisplay";
import "./UserPage.css"
import axios from "axios";

export default function UserPage(){
    const [currentPage, setCurrentPage] = useState("Collection")
    const [user, setUser] = useContext(UserContext)

    useEffect(() => {
		const querryUser = async () => {
			const res = await axios({
				method: "GET",
				withCredentials: true,
				url: "http://localhost:3001/user/profile",
			});
			console.log(res.data);
			setUser(res.data);
		};
		querryUser();
	}, []);

    const renderPage = () => {
        if(currentPage === "Collection"){
            return <UserCollection></UserCollection>
        }else if( currentPage === "Missing"){
            return(
                <h1>You are in the missing volumes page</h1>
            )
        }else if (currentPage === "Search"){
            return(
                <BrowseDisplay></BrowseDisplay>
            )
        }
    }

    const renderLoginRedirect = () => {
		return (
			<div className="redirect-page">
				<h1>User not connected</h1>
				<h2>Please login or Signup</h2>
				<Link to={"/login"}>Login</Link>
				<Link to={"/signup"}>Signup</Link>
			</div>
		);
	};

    return(
        <div>
            {user?renderPage():renderLoginRedirect()}
            <nav className="navbar">
                <button 
                    onClick={() => {setCurrentPage("Missing")}}
                    className="navbar__button"
                >Missing volumes</button>
                <button 
                    onClick={() => {setCurrentPage("Search")}}
                    className="navbar__button"
                >Search</button>
                <button 
                    onClick={() => {setCurrentPage("Collection")}}
                    className="navbar__button"
                >Profile</button>
            </nav>
        </div>
            //Header -> Profile info
            //body
                //Collection
                //Search
                //Missing volumes
            //Footer / navbar
    )
}