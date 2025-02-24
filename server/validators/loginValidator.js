const { body } = require("express-validator");

const loginInputValidation = body("login")
	.trim()
	.notEmpty()
	.withMessage("Um email ou nome de usuário deve ser informado.")
	.escape();

const passwordValidation = body("password")
	.trim()
	.notEmpty()
	.withMessage("Uma senha deve ser informada.")
	.escape();

const loginValidation = [loginInputValidation, passwordValidation];

module.exports = { loginValidation };
