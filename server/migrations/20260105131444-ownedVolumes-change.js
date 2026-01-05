module.exports = {
	async up(db, client) {
		const users = await db
			.collection("users")
			.find({
				ownedVolumes: { $exists: true, $not: { $size: 0 } },
			})
			.toArray();

		const operations = [];

		for (const user of users) {
			if (
				user.ownedVolumes[0] &&
				typeof user.ownedVolumes[0] === "object" &&
				user.ownedVolumes[0].volume
			) {
				continue;
			}

			const newOwnedVolumes = user.ownedVolumes.map((volumeId) => ({
				volume: volumeId,
				amount: 1,
				acquiredAt: new Date(),
				isRead: false,
			}));

			operations.push({
				updateOne: {
					filter: { _id: user._id },
					update: { $set: { ownedVolumes: newOwnedVolumes } },
				},
			});
		}

		if (operations.length > 0) {
			await db.collection("users").bulkWrite(operations);
			console.log(
				`Migrated ${operations.length} users to new volume structure.`
			);
		} else {
			console.log("No users needed migration.");
		}
	},

	async down(db, client) {
		const users = await db
			.collection("users")
			.find({
				ownedVolumes: { $exists: true, $not: { $size: 0 } },
			})
			.toArray();

		const operations = [];

		for (const user of users) {
			if (
				!user.ownedVolumes[0] ||
				typeof user.ownedVolumes[0] !== "object" ||
				!user.ownedVolumes[0].volume
			) {
				continue;
			}

			const oldOwnedVolumes = user.ownedVolumes.map((obj) => obj.volume);

			operations.push({
				updateOne: {
					filter: { _id: user._id },
					update: { $set: { ownedVolumes: oldOwnedVolumes } },
				},
			});
		}

		if (operations.length > 0) {
			await db.collection("users").bulkWrite(operations);
			console.log(`Rolled back ${operations.length} users to old ID list.`);
		} else {
			console.log("No users needed rollback.");
		}
	},
};
