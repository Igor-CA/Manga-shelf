import { SeriesCard } from "../../components/SeriesCard";
import SeriesCardList from "../../components/SeriesCardList";

export default function UserCollection({ user }) {
	//TODO Because there is no pagination this page does not work with the new seriesCardList. Refactoring of user API is needed 
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
