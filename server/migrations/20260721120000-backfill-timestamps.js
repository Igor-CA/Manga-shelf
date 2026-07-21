const COLLECTIONS = ["users", "reports", "series", "volumes", "notifications"];

module.exports = {
	async up(db) {
		for (const name of COLLECTIONS) {
			await db.collection(name).updateMany(
				{ createdAt: { $exists: false } },
				[
					{
						$set: {
							createdAt: { $toDate: "$_id" },
							updatedAt: {
								$ifNull: ["$updatedAt", { $toDate: "$_id" }],
							},
						},
					},
				],
			);
		}
	},

	async down(db) {
		for (const name of COLLECTIONS) {
			await db.collection(name).updateMany(
				{ $expr: { $eq: ["$updatedAt", { $toDate: "$_id" }] } },
				{ $unset: { createdAt: "", updatedAt: "" } },
			);
		}
	},
};
