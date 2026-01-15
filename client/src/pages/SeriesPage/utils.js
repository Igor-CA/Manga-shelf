export const printArray = (list) => {
	const listCount = list.length;
	if (listCount === 1) return list[0];
	if (listCount === 2) return `${list[0]} e ${list[1]}`;
	const allButLast = list.slice(0, -1).join(", ");
	return `${allButLast} e ${list[listCount - 1]}`;
};

export const formatDate = (dateString) => {
	const dateObj = new Date(dateString)	
	if (!(dateObj instanceof Date) || isNaN(dateObj)) {
		return "Invalid Date";
	}

	const day = String(dateObj.getUTCDate()).padStart(2, "0");
	const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
	const year = dateObj.getUTCFullYear();

	return `${day}/${month}/${year}`;
};

export const checkOwnedVolumes = (user, id) => {
	return user?.ownedVolumes
		? user.ownedVolumes.some(
				(entry) => entry.volume.toString() === id.toString()
		  )
		: false;
};

export const getOwnedVolumeInfo = (user, id) => {
	return user?.ownedVolumes?.find(
		(entry) => entry.volume.toString() === id.toString()
	);
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
