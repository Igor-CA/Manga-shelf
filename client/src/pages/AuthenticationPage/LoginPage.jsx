import { useState } from "react"
import { useNavigate } from "react-router-dom";
import axios from "axios"

export default function LoginPage(){
    const hostOrigin = process.env.REACT_APP_HOST_ORIGIN
    const [formData, setFormData] = useState({username:'', password:''})
    const navigate = useNavigate() ;
    
    const handleChange = (e) => {
        const {name, value} = e.target
        setFormData({...formData, [name]: value})
    }
    
    const handleSubmit = async(e) =>{
        e.preventDefault()
         const response = await axios({
            method: "POST",
            data: formData,
            withCredentials: true,
            url: "http://localhost:3001/user/login"
        })
        console.log(response)
    }
    
    return(
        <div>
            <form action="/login" method="post" onSubmit={(e) => {handleSubmit(e)}}>
                <label htmlFor="username">
                    Nome de usuário:
                    <input
                        type="text"
                        name="username"
                        onChange={(e) => {handleChange(e)}}
                    />
                </label>
                <label htmlFor="password">
                    Senha:
                    <input
                        type="password"
                        name="password"
                        onChange={(e) => {handleChange(e)}}
                    />
                </label>
                <button>Log in</button>
            </form>
            <button onClick={async() => {
                const res = await axios({
                    method: "GET",
                    withCredentials: true,
                    url: "http://localhost:3001/user/data"
                })
                console.log(res)
            }
            }>See results</button>
        </div>
    )
}