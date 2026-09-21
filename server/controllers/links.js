const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const LinkProvider = require("../models/LinkProvider");
const LinkClick = require("../models/LinkClick");
const { matchProvider } = require("../Utils/linkProviders");

exports.recordClick = asyncHandler(async (req, res) => {
	const { provider, targetModel, targetId } = req.body || {};

	if (
		!["Series", "Volume"].includes(targetModel) ||
		!mongoose.Types.ObjectId.isValid(targetId)
	) {
		return res.status(400).json({ msg: "Alvo inválido." });
	}

	const exists = await LinkProvider.exists({ key: provider });
	if (!exists) {
		return res.status(404).json({ msg: "Provedor desconhecido." });
	}

	await LinkClick.updateOne(
		{ provider, targetModel, targetId },
		{ $inc: { count: 1 }, $set: { lastClickedAt: new Date() } },
		{ upsert: true },
	);

	res.status(204).end();
});

const validateParsingConfig = (draft) => {
	const hasAny = draft.domains?.length || draft.idPattern || draft.sampleUrl;
	if (!hasAny) return null;

	if (!draft.domains?.length || !draft.idPattern || !draft.sampleUrl) {
		return "Para permitir colar links, informe domínios, padrão de extração e URL de exemplo juntos.";
	}

	if (!matchProvider(draft, draft.sampleUrl)) {
		return "A regra não conseguiu extrair um identificador da URL de exemplo.";
	}

	return null;
};

exports.listProviders = asyncHandler(async (req, res) => {
	const providers = await LinkProvider.find().sort({ name: 1 });
	res.json(providers);
});

exports.createProvider = asyncHandler(async (req, res) => {
	const {
		key,
		name,
		category,
		icon,
		brandColor,
		urlTemplate,
		affiliateTemplate,
		domains,
		idPattern,
		sampleUrl,
		active,
	} = req.body || {};

	if (!key || !name || !category || !icon || !brandColor || !urlTemplate) {
		return res.status(400).json({ msg: "Campos obrigatórios ausentes." });
	}

	const parsingError = validateParsingConfig({ domains, idPattern, sampleUrl });
	if (parsingError) return res.status(400).json({ msg: parsingError });

	try {
		const provider = await LinkProvider.create({
			key,
			name,
			category,
			icon,
			brandColor,
			urlTemplate,
			affiliateTemplate: affiliateTemplate || null,
			domains: domains || [],
			idPattern: idPattern || undefined,
			sampleUrl: sampleUrl || undefined,
			active: active !== undefined ? active : true,
		});
		res.status(201).json(provider);
	} catch (err) {
		if (err.code === 11000) {
			return res
				.status(409)
				.json({ msg: "Já existe um provedor com essa chave." });
		}
		throw err;
	}
});

const EDITABLE_PROVIDER_FIELDS = [
	"name",
	"category",
	"icon",
	"brandColor",
	"urlTemplate",
	"affiliateTemplate",
	"domains",
	"idPattern",
	"sampleUrl",
	"active",
];

exports.updateProvider = asyncHandler(async (req, res) => {
	const { id } = req.params;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).json({ msg: "Provedor inválido." });
	}

	const provider = await LinkProvider.findById(id);
	if (!provider) {
		return res.status(404).json({ msg: "Provedor não encontrado." });
	}

	for (const field of EDITABLE_PROVIDER_FIELDS) {
		if (req.body?.[field] !== undefined) provider[field] = req.body[field];
	}

	const parsingError = validateParsingConfig(provider);
	if (parsingError) return res.status(400).json({ msg: parsingError });

	await provider.save();
	res.json(provider);
});
