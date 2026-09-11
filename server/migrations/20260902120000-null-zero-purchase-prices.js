module.exports = {
	async up(db) {
		await db
			.collection("users")
			.updateMany(
				{ "ownedVolumes.purchasePrice": 0 },
				{ $set: { "ownedVolumes.$[priced].purchasePrice": null } },
				{ arrayFilters: [{ "priced.purchasePrice": 0 }] },
			);
	},

	async down() {},
};
