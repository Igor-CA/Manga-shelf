function escapeRegex(text) {
	return String(text ?? "").replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = { escapeRegex };
