const BOOLEAN_WORDS = { true: "Sim", false: "Não" };

const CONDITION_WORDS = { novo: "Novo", usado: "Usado" };

const LIST_WORDS = { userList: "Coleção", wishList: "Lista de desejos" };

const COLLECTION_STATUS_WORDS = {
	Collecting: "Incompleto",
	"Up to date": "Acompanhando publicação",
	Finished: "Concluído",
	Dropped: "Abandonado",
};

const VOLUME_COLUMNS = [
	{ header: "ID do volume", key: "volumeId", type: "id" },
	{ header: "ID da obra", key: "seriesId", type: "id" },
	{ header: "Obra", key: "seriesTitle", type: "text" },
	{ header: "Volume", key: "volumeNumber", type: "integer" },
	{ header: "Variante", key: "variantNumber", type: "integer" },
	{ header: "Lido", key: "isRead", type: "boolean" },
	{ header: "Lido em", key: "readAt", type: "date" },
	{ header: "Vezes lido", key: "readCount", type: "integer" },
	{ header: "Nota", key: "score", type: "integer" },
	{ header: "Preço pago", key: "purchasePrice", type: "decimal" },
	{
		header: "Condição",
		key: "condition",
		type: "enum",
		values: CONDITION_WORDS,
	},
	{ header: "Loja", key: "store", type: "text" },
	{ header: "Adquirido em", key: "acquiredAt", type: "date" },
	{ header: "Cópias", key: "amount", type: "integer" },
	{ header: "Notas", key: "notes", type: "text" },
];

const SERIES_COLUMNS = [
	{ header: "ID da obra", key: "seriesId", type: "id" },
	{ header: "Obra", key: "seriesTitle", type: "text" },
	{ header: "Editora", key: "publisher", type: "text" },
	{ header: "Lista", key: "list", type: "enum", values: LIST_WORDS },
	{
		header: "Status na coleção",
		key: "collectionStatus",
		type: "enum",
		values: COLLECTION_STATUS_WORDS,
	},
	{ header: "Progresso", key: "completionPercentage", type: "percent" },
	{ header: "Volumes possuídos", key: "ownedVolumeCount", type: "integer" },
	{ header: "Total de volumes", key: "totalVolumeCount", type: "integer" },
	{ header: "Nota", key: "score", type: "integer" },
	{
		header: "Nota média dos volumes",
		key: "averageVolumeScore",
		type: "decimal",
	},
];

module.exports = {
	VOLUME_COLUMNS,
	SERIES_COLUMNS,
	BOOLEAN_WORDS,
};
