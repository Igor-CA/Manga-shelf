import { SeriesCard } from "../../components/SeriesCard";
import SeriesCardList from "../../components/SeriesCardList";

export default function UserCollection({ user }) {
	const renderUserCollection = () => {
		return (
			<SeriesCardList list={user.userList}></SeriesCardList>
		);
	};

	return (
		<div className="user-collection container">
			{user && renderUserCollection()}
		</div>
	);
}
