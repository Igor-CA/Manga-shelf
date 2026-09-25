import { CONDITION_LABELS } from "../../utils/volumeConditions";
import { formatCurrency, formatDate } from "../../utils/formatters";

const READ_ONLY_FORMATTERS = {
	checkbox: (value) => (value ? "Sim" : "Não"),
	date: (value) => formatDate(value),
	price: (value) => (value != null ? formatCurrency(value) : null),
	condition: (value) => CONDITION_LABELS[value],
};

export function ReadOnlyCell({ column, row }) {
	const value = row[column.key];
	const format = READ_ONLY_FORMATTERS[column.type];
	const text = format ? format(value) : value;
	return text === null || text === undefined || text === "" ? "-" : text;
}
