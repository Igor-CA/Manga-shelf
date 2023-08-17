import { useContext, useEffect } from "react";
import { SeriesCard } from "./SeriesCard";
import { UserContext } from "./userProvider";
import { Link } from "react-router-dom";
import axios from "axios";

export default function UserCollection() {
	const [user, setUser] = useContext(UserContext);

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

	const renderUserCollection = () => {
		return (
			<div className="collection-container">
				{user.userList.map((seriesObj) => {
					const { title, _id, seriesCover } = seriesObj.Series;
					const completionPercentage = seriesObj.completionPercentage;
					return (
						<SeriesCard
							key={_id}
							seriesDetails={{
								title,
								_id,
								image: seriesCover,
								completionPercentage,
							}}
						></SeriesCard>
					);
				})}
			</div>
		);
	};

	return (
		<div className="user-collection">{user && renderUserCollection()}</div>
	);
}
