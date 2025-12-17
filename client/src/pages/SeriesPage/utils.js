export const printArray = (list) => {
	const listCount = list.length;
	if (listCount === 1) return list[0];
	if (listCount === 2) return `${list[0]} e ${list[1]}`;
	const allButLast = list.slice(0, -1).join(", ");
	return `${allButLast} e ${list[listCount - 1]}`;
};

export const checkOwnedVolumes = (user, id) => {
	return user ? user.ownedVolumes.includes(id) : false;
};

export const getCompletionPercentage = (user, id) => {
	const indexOfSeries = user.userList.findIndex(
		(seriesObj) => seriesObj.Series._id.toString() === id
	);
	return indexOfSeries !== -1
		? user.userList[indexOfSeries].completionPercentage
		: 0;
};
export const checkIfInWishlist = (user, id) => {
	if (!user.wishList) return false;
	const inWishList = user.wishList.some((entry) => entry.toString() === id);
	return inWishList;
};
export const getSeriesStatus = (user, id) => {
	const indexOfSeries = user.userList.findIndex(
		(seriesObj) => seriesObj.Series._id.toString() === id
	);
	return indexOfSeries !== -1 ? user.userList[indexOfSeries].status : "";
};
export const customWindowConfirm = (
	setters,
	message,
	onConfirmCb,
	onCancelCb
) => {
	const [
		setOnConfirm,
		setOnCancel,
		setConfirmationMessage,
		setShowConfirmation,
	] = setters;
	setOnConfirm(() => onConfirmCb);
	setOnCancel(() => onCancelCb);
	setConfirmationMessage(message);
	setShowConfirmation(true);
};
