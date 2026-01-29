module.exports = {
	async up(db, client) {
		const users = await db.collection("users").find({}).toArray();

		for (const user of users) {
			const old = user.settings?.notifications || {};
			const newGroups = {
				media: old.volumes !== undefined ? old.volumes : true,
				social: old.followers !== undefined ? old.followers : true,
				system: old.updates !== undefined ? old.updates : true,
			};

			await db.collection("users").updateOne(
				{ _id: user._id },
				{
					$set: {
						"settings.notifications.groups": newGroups,
					},
					$unset: {
						"settings.notifications.volumes": "",
						"settings.notifications.followers": "",
						"settings.notifications.updates": "",
					},
				},
			);
		}
	},

	async down(db, client) {
		await db.collection("users").updateMany(
			{},
			{
				$unset: { "settings.notifications.groups": "" },
			},
		);
	},
};
