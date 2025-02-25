const { body } = require("express-validator");

const passwordValidation = body("password")
	.trim()
	.notEmpty()
	.withMessage("É obrigatório informar uma senha.")
	.matches(
		/^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$/
	)
	.withMessage(
		"A senha deve conter pelo menos uma letra, número e caractere especial(!@#$%^&*) e ter entre 8 e 20 caracteres."
	)
	.escape();

const confirmPasswordValidation = body("confirm-password")
	.trim()
	.notEmpty()
	.withMessage("O campo de confirmar senha é obrigatório.")
	.custom((value, { req }) => {
		if (value !== req.body.password) {
			throw new Error("As senhas devem coincidir.");
		}
		return true;
	})
	.escape();


const newPasswordValidator = [
	passwordValidation,
	confirmPasswordValidation,
];

module.exports = { newPasswordValidator };
