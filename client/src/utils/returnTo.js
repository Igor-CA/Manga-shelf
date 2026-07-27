const STORAGE_KEY = "returnTo";

export function stash(path) {
	sessionStorage.setItem(STORAGE_KEY, path);
}

export function consume() {
	const path = sessionStorage.getItem(STORAGE_KEY);
	if (path) sessionStorage.removeItem(STORAGE_KEY);
	return path || null;
}
