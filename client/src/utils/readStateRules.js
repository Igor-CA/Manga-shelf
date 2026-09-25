const todayISO = () => new Date().toISOString().split("T")[0];

const marksAsRead = (field, value) =>
	field === "readCount" ? value > 0 : Boolean(value);

export function applyReadStateChange(current, field, value) {
	const next = { ...current, [field]: value };
	if (marksAsRead(field, value)) {
		return {
			isRead: true,
			readCount: next.readCount || 1,
			readAt: next.readAt || todayISO(),
		};
	}
	if (field === "readAt") return next;
	return { isRead: false, readCount: 0, readAt: null };
}
