export const formatCurrency = (value) =>
	value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const toDateInputValue = (isoDate) => {
	if (!isoDate) return null;
	return typeof isoDate === "string" ? isoDate.split("T")[0] : null;
};

export { formatDate } from "./seriesDataFunctions";
