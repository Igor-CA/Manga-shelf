
module.exports = {
	async up(db) {
		const users = db.collection("users");

		const dupUsernames = await users
			.aggregate([
				{ $match: { username: { $type: "string" } } },
				{
					$group: {
						_id: "$username",
						ids: { $push: "$_id" },
						count: { $sum: 1 },
					},
				},
				{ $match: { count: { $gt: 1 } } },
			])
			.toArray();

		const emptyUsernames = await users
			.find({ username: "" })
			.project({ _id: 1 })
			.toArray();

		const dupEmails = await users
			.aggregate([
				{
					$group: {
						_id: { $toLower: { $trim: { input: "$email" } } },
						ids: { $push: "$_id" },
						count: { $sum: 1 },
					},
				},
				{ $match: { count: { $gt: 1 } } },
			])
			.toArray();

		const problems = [];
		if (dupUsernames.length)
			problems.push(
				`Duplicate usernames (${dupUsernames.length}): ` +
					JSON.stringify(dupUsernames),
			);
		if (emptyUsernames.length)
			problems.push(
				`Empty-string usernames (${emptyUsernames.length}): ` +
					JSON.stringify(emptyUsernames.map((u) => u._id)),
			);
		if (dupEmails.length)
			problems.push(
				`Emails colliding after lowercase (${dupEmails.length}): ` +
					JSON.stringify(dupEmails),
			);

		if (problems.length) {
			throw new Error(
				"Aborting migration: resolve these user collisions by hand " +
					"BEFORE building the unique indexes.\n" +
					problems.join("\n"),
			);
		}

		const allUsers = await users
			.find({ email: { $type: "string" } })
			.project({ email: 1 })
			.toArray();
		const ops = [];
		for (const u of allUsers) {
			const normalized = u.email.toLowerCase().trim();
			if (normalized !== u.email) {
				ops.push({
					updateOne: {
						filter: { _id: u._id },
						update: { $set: { email: normalized } },
					},
				});
			}
		}
		if (ops.length) await users.bulkWrite(ops);

		await users.createIndex(
			{ username: 1 },
			{
				unique: true,
				partialFilterExpression: { username: { $type: "string" } },
			},
		);
		await users.createIndex({ email: 1 }, { unique: true });
	},

	async down(db) {
		const users = db.collection("users");
		await users.dropIndex("username_1").catch(() => {});
		await users.dropIndex("email_1").catch(() => {});
	},
};
