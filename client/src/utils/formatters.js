export const formatCurrency = (value) => {
	const amount = typeof value === "number" ? value : parseFloat(value);
	if (!Number.isFinite(amount)) return null;
	return amount.toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL",
	});
};

export { formatDate } from "./seriesDataFunctions";
