module.exports = {
	async up(db, client) {
		const session = client.startSession();
		try {
			const notificationsCollection = db.collection("notifications");
			const cursor = notificationsCollection.find({});

			const bulkOps = [];
			let counter = 0;

			const volumeRegex =
				/^Um novo volume de\s+(.*?)\s+foi adicionado ao site$/;
			const followerRegex = /^(.+?)\s+Começou a te seguir$/;

			while (await cursor.hasNext()) {
				const doc = await cursor.next();
				let newText = doc.text;
				let newType = doc.type;
				let shouldUpdate = false;

				const volMatch = doc.text.match(volumeRegex);
				if (volMatch && volMatch[1]) {
					const seriesTitle = volMatch[1];
					const volumeId = doc.associatedObject.toString();

					newText = `Um novo volume de [[${seriesTitle}|/volume/${volumeId}]] foi adicionado ao site`;
					shouldUpdate = true;
				}

				const followMatch = doc.text.match(followerRegex);
				if (followMatch && followMatch[1]) {
					const username = followMatch[1];
					newText = `[[${username}|/user/${username}]] começou a te seguir`;
					shouldUpdate = true;
				}

				if (shouldUpdate) {
					bulkOps.push({
						updateOne: {
							filter: { _id: doc._id },
							update: { $set: { text: newText } },
						},
					});
					counter++;
				}

				if (bulkOps.length >= 500) {
					await notificationsCollection.bulkWrite(bulkOps);
					bulkOps.length = 0;
				}
			}

			if (bulkOps.length > 0) {
				await notificationsCollection.bulkWrite(bulkOps);
			}

			console.log(`Migration finished. Updated ${counter} notifications.`);
		} finally {
			session.endSession();
		}
	},

	async down(db, client) {
		const notificationsCollection = db.collection("notifications");
		const cursor = notificationsCollection.find({});
		const bulkOps = [];

		const markupRegex = /\[\[(.*?)\|.*?\]\]/g;

		while (await cursor.hasNext()) {
			const doc = await cursor.next();
			let newText = doc.text;
			let shouldUpdate = false;

			if (newText.match(markupRegex)) {
				newText = newText.replace(markupRegex, (match, label) => {
					return label;
				});
				shouldUpdate = true;
			}

			if (shouldUpdate) {
				bulkOps.push({
					updateOne: {
						filter: { _id: doc._id },
						update: { $set: { text: newText } },
					},
				});
			}

			if (bulkOps.length >= 500) {
				await notificationsCollection.bulkWrite(bulkOps);
				bulkOps.length = 0;
			}
		}

		if (bulkOps.length > 0) {
			await notificationsCollection.bulkWrite(bulkOps);
		}
	},
};
