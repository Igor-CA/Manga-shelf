export const PREVIOUS_UNREAD_PROMPT =
	"Deseja marcar os volumes anteriores como lidos também?";

export const findPreviousUnread = (volumes, volumeId) => {
	const index = volumes.findIndex((volume) => volume.volumeId === volumeId);
	if (index === -1) return [];
	return volumes
		.slice(0, index)
		.filter((volume) => volume.ownsVolume && !volume.isRead && !volume.isVariant);
};
