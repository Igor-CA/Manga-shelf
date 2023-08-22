import { useContext, useEffect } from "react";
import { SeriesCard } from "../../components/SeriesCard";
import { UserContext } from "../../components/userProvider";
import { Link } from "react-router-dom";
import axios from "axios";

export default function ProfilePage() {
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

	const renderProfile = () => {
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
		<div className="ProfilePage">
			{user && renderProfile()}
		</div>
	);
}
