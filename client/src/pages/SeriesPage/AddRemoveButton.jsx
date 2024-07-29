export default function AddOrRemoveButton({
	user,
	seriesId,
	handleRemoveSeries,
	addOrRemoveSeries,
}) {
	const inList =
		user &&
		user.userList.some(
			(seriesObj) => seriesObj.Series._id.toString() === seriesId
		);

	return (
		<button
			className={`button button--grow button--${
				inList ? "red" : "green"
			}`}
			onClick={() => {
				if (!user) {
					return;
				}
				inList ? handleRemoveSeries() : addOrRemoveSeries(true);
			}}
		>
			{inList ? "Remover coleção" : "Adicionar coleção"}
		</button>
	);
}
