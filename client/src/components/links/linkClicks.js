export const recordLinkClick = (payload) => {
	try {
		const blob = new Blob([JSON.stringify(payload)], {
			type: "application/json",
		});
		navigator.sendBeacon?.(
			`${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/link-click`,
			blob,
		);
	} catch {
		// Never let measurement get in the way of the click.
	}
};
