import axios from "axios";
import { useContext, useEffect } from "react";
import { UserContext } from "../../components/userProvider";
import "../404Page/NotFound.css";
export default function LogoutPage() {
	const { user, setOutdated } = useContext(UserContext);
	useEffect(() => {
		const logout = async () => {
			try {
				await axios({
					method: "GET",
					withCredentials: true,
					headers: {
						Authorization: import.meta.env.REACT_APP_API_KEY,
					},
					url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/logout`,
				});
				setOutdated(true);
				window.location.href = "/";
			} catch (error) {
				console.log(error);
			}
		};
		if (!user) return;
		logout();
	}, [user, setOutdated]);
	return (
		<div className="page-content">
			<div className="container">
				<div className="not-found">
					<h1>Você está sendo desconectado</h1>
				</div>
			</div>
		</div>
	);
}
