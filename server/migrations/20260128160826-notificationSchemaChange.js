module.exports = {
	async up(db, client) {
		const notifications = await db
			.collection("notifications")
			.find({})
			.toArray();

		for (const notif of notifications) {
			let group = "system";
			let eventKey = "site_update";

			if (notif.type === "volumes") {
				group = "media";
				eventKey = "new_volume";
			} else if (notif.type === "followers") {
				group = "social";
				eventKey = "new_follower";
			} else if (notif.type === "site") {
				group = "system";
				eventKey = "site_update";
			}

			await db.collection("notifications").updateOne(
				{ _id: notif._id },
				{
					$set: {
						group: group,
						eventKey: eventKey,
					},
					$unset: { type: "" },
				},
			);
		}
	},

	async down(db, client) {
		const notifications = await db
			.collection("notifications")
			.find({})
			.toArray();

		for (const notif of notifications) {
			let originalType = "site";

			if (notif.group === "media") {
				originalType = "volumes";
			} else if (notif.group === "social") {
				originalType = "followers";
			} else if (notif.group === "system") {
				originalType = "site";
			}

			await db.collection("notifications").updateOne(
				{ _id: notif._id },
				{
					$set: { type: originalType },
					$unset: { group: "", eventKey: "" },
				},
			);
		}
	},
};
