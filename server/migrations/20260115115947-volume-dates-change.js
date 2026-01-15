module.exports = {
	async up(db, client) {
		const collection = db.collection("volumes");
		const bulkOps = [];

		const cursor = collection.find({ date: { $type: "string" } });

		while (await cursor.hasNext()) {
			const doc = await cursor.next();
			const dateStr = doc.date ? doc.date.trim() : null;

			if (!dateStr) continue;

			let newDate = null;
			const parts = dateStr.split("/");

			try {
				if (parts.length === 3) {
					const [day, month, year] = parts;
					newDate = new Date(Date.UTC(year, month - 1, day));
				}
				else if (parts.length === 2) {
					const [month, year] = parts;
					newDate = new Date(Date.UTC(year, month - 1, 1));
				}
				else if (parts.length === 1 && dateStr.length === 4) {
					newDate = new Date(Date.UTC(dateStr, 0, 1));
				}

				if (newDate && !isNaN(newDate.getTime())) {
					bulkOps.push({
						updateOne: {
							filter: { _id: doc._id },
							update: { $set: { date: newDate } },
						},
					});
				}
			} catch (err) {
				console.warn(`Skipping doc ${doc._id} due to parse error: ${dateStr}`);
			}

			if (bulkOps.length >= 1000) {
				await collection.bulkWrite(bulkOps);
				bulkOps.length = 0; 
			}
		}

		if (bulkOps.length > 0) {
			await collection.bulkWrite(bulkOps);
		}
	},

	async down(db, client) {

		const collection = db.collection("volumes");
		const bulkOps = [];

		const cursor = collection.find({ date: { $type: "date" } });

		while (await cursor.hasNext()) {
			const doc = await cursor.next();

			if (!doc.date) continue;

			const d = doc.date;
			const day = String(d.getUTCDate()).padStart(2, "0");
			const month = String(d.getUTCMonth() + 1).padStart(2, "0");
			const year = d.getUTCFullYear();

			const originalFormatStr = `${day}/${month}/${year}`;

			bulkOps.push({
				updateOne: {
					filter: { _id: doc._id },
					update: { $set: { date: originalFormatStr } },
				},
			});

			if (bulkOps.length >= 1000) {
				await collection.bulkWrite(bulkOps);
				bulkOps.length = 0;
			}
		}

		if (bulkOps.length > 0) {
			await collection.bulkWrite(bulkOps);
		}
	},
};
