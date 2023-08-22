import { Link } from "react-router-dom";
import ReactDOM from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserPlus, faMagnifyingGlass, faRightToBracket, faBars, faBug, faXmark } from '@fortawesome/free-solid-svg-icons'
import "./NavBar.css"
import { useState } from "react";
export default function NavBar(){
    const [menuVisibility, setMenuVisibility] = useState(true)
    return(
        <div className="mobile-menu" >
            <div 
                className="hamburger"
                style={{display: (menuVisibility)?"none":""}}
                onClick={() => {setMenuVisibility(true)}}
            >
                <FontAwesomeIcon icon={faBars} size="2x" fixedWidth  />
            </div>
            <nav className={`navbar ${(menuVisibility)?"visible":""}`}>
                <Link to={"/info"} className="navbar__button" onClick={() => {setMenuVisibility(false)}}>
                    <FontAwesomeIcon icon={faUserPlus} size="xl" fixedWidth />
                    <span className="navbar__label">About</span>
                </Link>
        
                <Link to={"/browse"} className="navbar__button" onClick={() => {setMenuVisibility(false)}}>
                    <FontAwesomeIcon icon={faMagnifyingGlass} size="lg" fixedWidth />
                    <span className="navbar__label">Search</span>
                </Link>
                                
                <Link to={"/signup"} className="navbar__button" onClick={() => {setMenuVisibility(false)}}>
                    <FontAwesomeIcon icon={faBug} size="lg" fixedWidth />
                    <span className="navbar__label">Report </span>
                </Link>

                <Link to={"/login"} className="navbar__button" onClick={() => {setMenuVisibility(false)}}>
                    <FontAwesomeIcon icon={faRightToBracket} size="lg" fixedWidth />
                    <span className="navbar__label">Log in</span>
                </Link>
                
                <Link to={"/signup"} className="navbar__button" onClick={() => {setMenuVisibility(false)}}>
                    <FontAwesomeIcon icon={faUserPlus} size="lg" fixedWidth />
                    <span className="navbar__label">Sign up</span>
                </Link>

                <div 
                    className="navbar__button"
                    onClick={() => {setMenuVisibility(false)}}
                ><FontAwesomeIcon icon={faXmark} size="lg" fixedWidth /></div>
            </nav>
        </div>
    )
}