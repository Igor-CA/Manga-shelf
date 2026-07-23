let stored = null;

export function get(key) {
	return stored && stored.key === key ? stored.snapshot : undefined;
}

export function set(key, snapshot) {
	stored = { key, snapshot };
}
