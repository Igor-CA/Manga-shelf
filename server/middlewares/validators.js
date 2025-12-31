const { validationResult } = require("express-validator");
const { body } = require("express-validator");

// --- Validators ---
const emailValidation = body("email")
	.trim()
	.notEmpty()
	.withMessage("É obrigatório informar um email.")
	.isEmail()
	.withMessage("O email inserido não é um email válido")
	.escape();

const loginInputValidation = body("login")
	.trim()
	.notEmpty()
	.withMessage("Um email ou nome de usuário deve ser informado.")
	.escape();

const passwordValidation = body("password")
	.trim()
	.notEmpty()
	.withMessage("Uma senha deve ser informada.")

const usernameValidation = body("username")
	.trim()
	.notEmpty()
	.withMessage("É obrigatório informar um nome de usuário.")
	.matches(/^[A-Za-z0-9]{3,16}$/)
	.withMessage(
		"O nome de usuário não pode ter caracteres especiais (!@#$%^&* ) e deve ter entre 3 e 16 caracteres."
	)
	.escape();

const newPasswordValidation = body("password")
	.trim()
	.notEmpty()
	.withMessage("É obrigatório informar uma senha.")
	.matches(
		/^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$/
	)
	.withMessage(
		"A senha deve conter pelo menos uma letra, número e caractere especial(!@#$%^&*) e ter entre 8 e 20 caracteres."
	)

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

const tosValidation = body("tos-checkbox")
	.notEmpty()
	.withMessage("Concorde com nossos termos para criar uma conta.");

const reportDetailsValidation = body("details")
	.trim()
	.notEmpty()
	.withMessage("Detalhes devem ser especificados.");

const reportLocalValidation = body("local")
	.trim()
	.notEmpty()
	.withMessage("O local deve ser especificado.")
	.escape();

const reportPageValidation = body("page")
	.trim()
	.notEmpty()
	.withMessage("A página em específico deve ser citada.")
	.escape();

const reportTypeValidation = body("type")
	.trim()
	.notEmpty()
	.withMessage("O tipo de sugestão deve ser especificada.")
	.escape();

const reportUserValidation = body("user").trim().escape();

// --- Validations ---
const forgotPasswordValidation = [emailValidation];
const loginValidation = [loginInputValidation, passwordValidation];
const newPasswordValidator = [newPasswordValidation, confirmPasswordValidation];
const signupValidation = [
	emailValidation,
	usernameValidation,
	newPasswordValidation,
	confirmPasswordValidation,
	tosValidation,
];
const changeUsernameValidator = [usernameValidation];
const changeEmailValidator = [emailValidation];
const changePasswordValidator = [
	newPasswordValidation,
	confirmPasswordValidation,
];
const reportsValidation = [
	reportDetailsValidation,
	reportLocalValidation,
	reportTypeValidation,
	reportPageValidation,
	reportUserValidation,
];
// Middleware to handle validation errors
const validateRequest = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({
			msg: errors.array().map((error) => error.msg),
		});
	}
	next();
};

// Export
module.exports = {
	forgotPasswordValidation,
	signupValidation,
	loginValidation,
	newPasswordValidator,
	changeUsernameValidator,
	changeEmailValidator,
	changePasswordValidator,
	reportsValidation,
	validateRequest,
};
