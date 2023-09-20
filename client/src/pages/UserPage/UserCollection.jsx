import { SeriesCard } from "../../components/SeriesCard";

export default function UserCollection({ user }) {
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
		<div className="user-collection container">
			{user && renderUserCollection()}
		</div>
	);
}
