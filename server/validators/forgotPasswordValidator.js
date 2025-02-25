const { body } = require("express-validator");

const emailValidation = body("email")
	.trim()
	.notEmpty()
	.withMessage("É obrigatório informar um email.")
	.isEmail()
	.withMessage("O email inserido não é um email válido")
	.escape();

const forgotPasswordValidation = [
	emailValidation,
];

module.exports = { forgotPasswordValidation };
