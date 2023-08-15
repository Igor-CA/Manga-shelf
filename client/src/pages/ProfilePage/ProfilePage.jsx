import { useContext } from "react";
import { SeriesCard } from "../../components/SeriesCard";
import { UserContext } from "../../components/userProvider";
import { Link } from "react-router-dom";

export default function ProfilePage() {
	const [user, setUser] = useContext(UserContext);

	const renderProfile = () => {
		return (
			<div className="collection-container">
				{user.userList.map((seriesObj) => {
					const { title, _id, seriesCover } = seriesObj.Series;
					const completionPercentage = seriesObj.completionPercentage;
					console.log(seriesObj.completionPercentage);
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

	return (
		<div className="ProfilePage">
			{user ? renderProfile() : renderLoginRedirect()}
		</div>
	);
}
