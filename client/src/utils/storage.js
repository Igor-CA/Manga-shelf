export const readStorage = (key) => {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
};

export const writeStorage = (key, value) => {
	try {
		localStorage.setItem(key, value);
	} catch {
		return;
	}
};
