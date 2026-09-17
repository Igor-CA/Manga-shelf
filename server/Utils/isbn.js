const isbn13ToIsbn10 = (isbn13) => {
	const digits = typeof isbn13 === "string" ? isbn13.replace(/[^0-9]/g, "") : "";
	if (digits.length !== 13 || !digits.startsWith("978")) return null;

	const core = digits.slice(3, 12);
	let sum = 0;
	for (let i = 0; i < 9; i++) {
		sum += (10 - i) * Number(core[i]);
	}
	const remainder = (11 - (sum % 11)) % 11;

	return core + (remainder === 10 ? "X" : String(remainder));
};

module.exports = { isbn13ToIsbn10 };
