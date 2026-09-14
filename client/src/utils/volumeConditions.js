export const VOLUME_CONDITIONS = [
	{ value: "usado", label: "Usado" },
	{ value: "novo", label: "Novo" },
];

export const CONDITION_LABELS = Object.fromEntries(
	VOLUME_CONDITIONS.map(({ value, label }) => [value, label]),
);
