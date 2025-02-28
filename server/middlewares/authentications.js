//Middleware for authentication
function requireAuth(req, res, next) {
	if (!req.isAuthenticated()) {
		return res.status(401).json({ msg: "Usuário deve estar logado" });
	}
	next();
}

// Export
module.exports = {
	requireAuth,
};
