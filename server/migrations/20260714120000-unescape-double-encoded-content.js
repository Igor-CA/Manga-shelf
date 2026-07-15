function unescapeOnce(str) {
	return str
		.replace(/&quot;/g, '"')
		.replace(/&#x27;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&#x2F;/g, "/")
		.replace(/&#x5C;/g, "\\")
		.replace(/&#96;/g, "`")
		.replace(/&amp;/g, "&");
}

const MAX_PASSES = 5;
function unescapeDeep(value) {
	if (typeof value !== "string" || !value.includes("&")) return value;
	let current = value;
	for (let i = 0; i < MAX_PASSES; i++) {
		const next = unescapeOnce(current);
		if (next === current) break;
		current = next;
	}
	return current;
}

async function migrateSimpleFields(db, collectionName, fields, stats) {
	const col = db.collection(collectionName);
	const docs = await col
		.find({ $or: fields.map((f) => ({ [f]: /&/ })) })
		.project(Object.fromEntries(fields.map((f) => [f, 1])))
		.toArray();

	const ops = [];
	for (const doc of docs) {
		const $set = {};
		for (const field of fields) {
			const original = field.split(".").reduce((o, k) => o?.[k], doc);
			const fixed = unescapeDeep(original);
			if (typeof fixed === "string" && fixed !== original) $set[field] = fixed;
		}
		if (Object.keys($set).length > 0) {
			ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set } } });
		}
	}
	if (ops.length > 0) await col.bulkWrite(ops);
	stats[collectionName] = (stats[collectionName] || 0) + ops.length;
}

module.exports = {
	async up(db) {
		const stats = {};

		const users = db.collection("users");
		const userDocs = await users
			.find({ $or: [{ email: /&/ }, { "ownedVolumes.notes": /&/ }] })
			.project({ email: 1, ownedVolumes: 1 })
			.toArray();

		const userOps = [];
		for (const user of userDocs) {
			const $set = {};

			const fixedEmail = unescapeDeep(user.email);
			if (typeof fixedEmail === "string" && fixedEmail !== user.email) {
				$set.email = fixedEmail;
			}

			if (Array.isArray(user.ownedVolumes)) {
				user.ownedVolumes.forEach((ov, i) => {
					const fixed = unescapeDeep(ov?.notes);
					if (typeof fixed === "string" && fixed !== ov.notes) {
						$set[`ownedVolumes.${i}.notes`] = fixed;
					}
				});
			}

			if (Object.keys($set).length > 0) {
				userOps.push({
					updateOne: { filter: { _id: user._id }, update: { $set } },
				});
			}
		}
		if (userOps.length > 0) {
			try {
				await users.bulkWrite(userOps);
			} catch (err) {
				if (err.code === 11000 || err.writeErrors) {
					throw new Error(
						"Un-escaping emails collided with the unique email index, two " +
							"accounts resolve to the same address. Resolve by hand, then " +
							"re-run.\n" +
							err.message,
					);
				}
				throw err;
			}
		}
		stats.users = userOps.length;

		await migrateSimpleFields(db, "collectionphotos", ["description"], stats);
		await migrateSimpleFields(db, "submissions", ["notes", "payload.title"], stats);
		await migrateSimpleFields(
			db,
			"reports",
			["local", "page", "type", "user"],
			stats,
		);

		console.log("Un-escaped documents per collection:", stats);
	},

	async down() {
	},
};
