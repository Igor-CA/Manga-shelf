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
	.withMessage("Uma senha deve ser informada.");

const usernameValidation = body("username")
	.trim()
	.notEmpty()
	.withMessage("É obrigatório informar um nome de usuário.")
	.matches(/^[A-Za-z0-9]{3,16}$/)
	.withMessage(
		"O nome de usuário não pode ter caracteres especiais (!@#$%^&* ) e deve ter entre 3 e 16 caracteres.",
	)
	.escape();

const newPasswordValidation = body("password")
	.trim()
	.notEmpty()
	.withMessage("É obrigatório informar uma senha.")
	.matches(
		/^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$/,
	)
	.withMessage(
		"A senha deve conter pelo menos uma letra, número e caractere especial(!@#$%^&*) e ter entre 8 e 20 caracteres.",
	);

const confirmPasswordValidation = body("confirm-password")
	.trim()
	.notEmpty()
	.withMessage("O campo de confirmar senha é obrigatório.")
	.custom((value, { req }) => {
		if (value !== req.body.password) {
			throw new Error("As senhas devem coincidir.");
		}
		return true;
	});

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

const volumeIdValidation = body("_id")
	.trim()
	.notEmpty()
	.withMessage("O ID do volume é obrigatório.")
	.isMongoId()
	.withMessage("ID de volume inválido.")
	.escape();

const acquiredAtValidation = body("acquiredAt")
	.optional({ checkFalsy: true, nullable: true })
	.trim()
	.isISO8601()
	.withMessage("A data de aquisição deve ser uma data válida (YYYY-MM-DD).")
	.toDate();

const readAtValidation = body("readAt")
	.optional({ checkFalsy: true, nullable: true })
	.trim()
	.isISO8601()
	.withMessage("A data de leitura deve ser uma data válida (YYYY-MM-DD).")
	.toDate();

const priceValidation = body("price")
	.optional({ checkFalsy: true })
	.isFloat({ min: 0 })
	.withMessage("O preço deve ser um valor numérico positivo.")
	.toFloat();

const amountValidation = body("amount")
	.notEmpty()
	.withMessage("A quantidade é obrigatória.")
	.isInt({ min: 1 })
	.withMessage("Você deve possuir pelo menos 1 cópia para editar esse volume.")
	.toInt();

const readCountValidation = body("readCount")
	.optional({ checkFalsy: true })
	.isInt({ min: 0 })
	.withMessage("O número de vezes lido deve ser um inteiro positivo.")
	.toInt();

const isReadValidation = body("isRead")
	.notEmpty()
	.withMessage("O status de leitura é obrigatório.")
	.isBoolean()
	.withMessage("O valor de 'Lido' deve ser verdadeiro ou falso.")
	.toBoolean();

const notesValidation = body("notes")
	.optional()
	.trim()
	.isLength({ max: 500 })
	.withMessage("As anotações não podem exceder 500 caracteres.")
	.escape();

const photoDescriptionValidation = body("description")
	.optional()
	.trim()
	.isLength({ max: 1000 })
	.withMessage("A descrição não pode exceder 1000 caracteres.")
	.escape();

const photoDateValidation = body("date")
	.optional()
	.trim()
	.isISO8601()
	.withMessage("Data inválida.")
	.toDate();

const photoOrderValidation = body("order")
	.optional()
	.isInt()
	.withMessage("A ordem deve ser um número inteiro.")
	.toInt();

const photoVisibleValidation = body("isVisible")
	.optional()
	.customSanitizer((value) => {
		if (value === "true") return true;
		if (value === "false") return false;
		return value;
	})
	.isBoolean()
	.withMessage("isVisible deve ser verdadeiro ou falso.")
	.toBoolean();

const photoAdultValidation = body("isAdultContent")
	.optional()
	.customSanitizer((value) => {
		if (value === "true") return true;
		if (value === "false") return false;
		return value;
	})
	.isBoolean()
	.withMessage("isAdultContent deve ser verdadeiro ou falso.")
	.toBoolean();

//Submissions
const submissionTargetModelValidation = body("targetModel")
	.trim()
	.notEmpty()
	.withMessage("O modelo alvo (Series/Volume) é obrigatório.")
	.isIn(["Series", "Volume"])
	.withMessage("O alvo deve ser 'Series' ou 'Volume'.");

const submissionTargetIdValidation = body("targetId")
	.optional({ nullable: true, checkFalsy: true })
	.isMongoId()
	.withMessage("ID do alvo inválido.");

const submissionNotesValidation = body("notes")
	.trim()
	.notEmpty()
	.withMessage("É obrigatório informar anotações/notas.")
	.escape();

const payloadValidation = body("payload")
	.exists()
	.withMessage("O payload da submissão está vazio.")
	.isObject()
	.withMessage("O payload deve ser um objeto.");

const payloadTitleValidation = body("payload.title")
	.optional()
	.trim()
	.notEmpty()
	.withMessage("O título não pode estar vazio.")
	.escape();

const payloadArrayValidation = body([
	"payload.authors",
	"payload.synonyms",
	"payload.summary",
])
	.optional()
	.isArray()
	.withMessage("Autores, Sinônimos e Sinopse devem ser listas (arrays).");

const payloadDatesValidation = body([
	"payload.dates.publishedAt",
	"payload.dates.finishedAt",
])
	.optional({ checkFalsy: true, nullable: true })
	.trim()
	.isISO8601()
	.withMessage("Datas devem estar no formato válido (YYYY-MM-DD).")
	.toDate();

const payloadNumbersValidation = body([
	"payload.specs.dimensions.width",
	"payload.specs.dimensions.height",
	"payload.specs.volumesInFormat",
	"payload.originalRun.totalVolumes",
	"payload.originalRun.totalChapters",
])
	.optional({ checkFalsy: true })
	.isFloat({ min: 0 })
	.withMessage("Dimensões e totais devem ser números positivos.")
	.toFloat();

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

const editOwnedValidation = [
	volumeIdValidation,
	acquiredAtValidation,
	readAtValidation,
	priceValidation,
	amountValidation,
	readCountValidation,
	isReadValidation,
	notesValidation,
];
const photoValidation = [
	photoDescriptionValidation,
	photoDateValidation,
	photoOrderValidation,
	photoVisibleValidation,
	photoAdultValidation,
];

const submissionValidation = [
	submissionTargetModelValidation,
	submissionTargetIdValidation,
	submissionNotesValidation,
	payloadValidation,
	payloadTitleValidation,
	payloadArrayValidation,
	payloadDatesValidation,
	payloadNumbersValidation,
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
	editOwnedValidation,
	photoValidation,
	submissionValidation,
	validateRequest,
};
