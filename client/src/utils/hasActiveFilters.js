export const hasActiveFilters = (params, searchBarValue) =>
	Boolean(searchBarValue) ||
	Object.entries(params).some(
		([key, value]) =>
			key !== "ordering" &&
			key !== "p" &&
			key !== "view" &&
			key !== "groupBy" &&
			value,
	);
