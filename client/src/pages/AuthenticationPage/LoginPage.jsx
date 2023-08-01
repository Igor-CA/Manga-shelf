import { useState } from "react"
import { useNavigate } from "react-router-dom";

export default function LoginPage(){
    const [formData, setFormData] = useState({username:'', password:''})
    const navigate = useNavigate() ;
    
    const handleChange = (e) => {
        const {name, value} = e.target
        setFormData({...formData, [name]: value})
    }
    
    const handleSubmit = async(e) =>{
        e.preventDefault()
        try {
            const response = await fetch(`http://192.168.1.10:3001/user/login`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            const data = await response.json();
            console.log(data)
            if(response.ok){
                navigate('/')
            }
        } catch (error) {
            console.error('Error fetching user Data:', error);
        }
    }
    
    return(
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
    )
}