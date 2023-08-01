import { useState } from "react"

export default function SignupPage(){
    const [formData, setFormData] = useState({username:'', password:'', email:''})
    
    const handleChange = (e) => {
        const {name, value} = e.target
        setFormData({...formData, [name]: value})
    }
    
    const handleSubmit = async(e) =>{
        e.preventDefault()
        try {
            const response = await fetch(`http://192.168.1.10:3001/user/signup`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            const data = await response.json();
            console.log(data)
        } catch (error) {
            console.error('Error fetching user Data:', error);
        }
    }
    
    return(
        <form method="post" onSubmit={(e) => {handleSubmit(e)}}>
            <label htmlFor="email">
                Email:<input 
                    type="email" 
                    name="email"
                    onChange={(e) => {handleChange(e)}}
                />
            </label>
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
            <button>Signup</button>
        </form>
    )
}