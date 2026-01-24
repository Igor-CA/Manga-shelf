const Volume = require("../models/volume");
const mongoose = require("mongoose");
const User = require("../models/User");
const Series = require("../models/Series");
const Notification = require("../models/Notification");
const UserNotificationStatus = require("../models/UserNotificationStatus");
const { getVolumeCoverURL } = require("../Utils/getCoverFunctions");
const asyncHandler = require("express-async-handler");
const ITEMS_PER_PAGE = 10;

exports.all = asyncHandler(async (req, res, next) => {
	const page = req.query.p ? Number(req.query.p) : 0;
	const skip = ITEMS_PER_PAGE * page;
	const volumes = await Volume.find({}, "number")
		.populate("serie", "title")
		.skip(skip)
		.limit(ITEMS_PER_PAGE)
		.exec();

	res.send(volumes);
});

exports.getVolumeDetails = asyncHandler(async (req, res, next) => {
	const validId = mongoose.Types.ObjectId.isValid(req.params.id);
	if (!validId) {
		res.status(400).json({ msg: "volume not found" });
		return;
	}

	const desiredVolume = await Volume.findById(req.params.id)
		.populate("serie", "title volumes isAdult authors status genres")
		.exec();

	if (!desiredVolume) {
		res.status(400).json({ msg: "volume not found" });
		return;
	}

	const { serie, number } = desiredVolume;
	const variant = desiredVolume.isVariant || false;
	res.send({
		...desiredVolume._doc,
		image: getVolumeCoverURL(
			serie,
			number,
			variant,
			desiredVolume.variantNumber,
		),
	});
});

exports.deleteVolumeAndNotify = async (req, res) => {
	const { volumeId, reason } = req.body;

	if (!volumeId || !reason) {
		return res
			.status(400)
			.json({ message: "Volume ID and Reason are required." });
	}

	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const volume = await Volume.findById(volumeId)
			.populate("serie", "title")
			.session(session);
		if (!volume) {
			await session.abortTransaction();
			return res.status(404).json({ message: "Volume not found." });
		}

		const affectedUsers = await User.find({ "ownedVolumes.volume": volumeId })
			.select("_id")
			.session(session);

		const affectedUserIds = affectedUsers.map((u) => u._id);

		const deletionNotification = new Notification({
			type: "media",
			text: `Um volume que você possuía de [[${volume.serie.title}|/series/${volume.serie._id}]] foi removido do site.`,
			details: [`Motivo: ${reason}`],
			objectType: "Volume",
		});

		await deletionNotification.save({ session });

		if (affectedUserIds.length > 0) {
			await User.updateMany(
				{ _id: { $in: affectedUserIds } },
				{
					$pull: { ownedVolumes: { volume: volumeId } },
					$push: {
						notifications: {
							notification: deletionNotification._id,
							seen: false,
							date: new Date(),
						},
					},
				},
			).session(session);
		}

		if (volume.serie) {
			await Series.updateOne(
				{ _id: volume.serie },
				{ $pull: { volumes: volumeId } },
			).session(session);
		}

		const oldNotifications = await Notification.find({
			associatedObject: volumeId,
			objectType: "Volume",
		}).session(session);

		const oldNotificationIds = oldNotifications.map((n) => n._id);

		if (oldNotificationIds.length > 0) {
			await User.updateMany(
				{ "notifications.notification": { $in: oldNotificationIds } },
				{
					$pull: {
						notifications: { notification: { $in: oldNotificationIds } },
					},
				},
			).session(session);

			await UserNotificationStatus.deleteMany({
				notification: { $in: oldNotificationIds },
			}).session(session);

			await Notification.deleteMany({
				_id: { $in: oldNotificationIds },
			}).session(session);
		}

		await Volume.deleteOne({ _id: volumeId }).session(session);

		await session.commitTransaction();
		session.endSession();
		logger.warn(`Series removed by ${req.user.username}`);

		return res.status(200).json({
			success: true,
			message: `Volume deleted. ${affectedUserIds.length} users were notified and updated.`,
		});
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		logger.error("Delete Volume Error:", error);
		return res
			.status(500)
			.json({ message: "Internal Server Error", error: error.message });
	}
};
