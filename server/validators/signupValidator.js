const { body } = require("express-validator");

const emailValidation = body("email")
	.trim()
	.notEmpty()
	.withMessage("É obrigatório informar um email.")
	.isEmail()
	.withMessage("O email inserido não é um email válido")
	.escape();

const usernameValidation = body("username")
	.trim()
	.notEmpty()
	.withMessage("É obrigatório informar um nome de usuário.")
	.matches(/^[A-Za-z0-9]{3,16}$/)
	.withMessage(
		"O nome de usuário não pode ter caracteres especiais (!@#$%^&* ) e deve ter entre 3 e 16 caracteres."
	)
	.escape();

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

const tosValidation = body("tos-checkbox")
	.notEmpty()
	.withMessage("Concorde com nossos termos para criar uma conta.");

const signupValidation = [
	emailValidation,
	usernameValidation,
	passwordValidation,
	confirmPasswordValidation,
	tosValidation,
];

module.exports = { signupValidation };
