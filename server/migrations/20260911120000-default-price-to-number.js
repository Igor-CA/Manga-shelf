module.exports = {
	async up(db) {
		await db.collection("volumes").updateMany(
			{ defaultPrice: { $type: "string" } },
			[
				{
					$set: {
						defaultPrice: {
							$convert: {
								input: "$defaultPrice",
								to: "double",
								onError: null,
								onNull: null,
							},
						},
					},
				},
			],
		);
	},

	async down(db) {
		await db
			.collection("volumes")
			.updateMany({ defaultPrice: { $type: "number" } }, [
				{ $set: { defaultPrice: { $toString: "$defaultPrice" } } },
			]);
	},
};
