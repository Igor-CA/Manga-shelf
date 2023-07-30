const series = require("../models/Series")
const volume = require("../models/volume")
const asyncHandler = require("express-async-handler");

exports.all = asyncHandler(async(req, res, next) => {
    const page = (req.query.p)?+req.query.p:0
    const step = 10
    const values = await volumes.find({}, "number").populate("serie", "title").skip(step*page).limit(step).exec()
    res.send(values)
})


exports.getVolumeDetails = asyncHandler(async(req, res, next) => {
    const desiredVolume = await volume.findById(req.params.id).populate("serie", "title").exec()
    const sanitizedTitle = desiredVolume.serie.title.replaceAll(/[?:/–\s]+/g, '-').replaceAll(/-+/g, '-');
    const nameURL = encodeURIComponent(sanitizedTitle)
    const imageURL = `http://${process.env.HOST_ORIGIN}:3001/images/cover-${nameURL}-${desiredVolume.number}.jpg`;
    res.send({...desiredVolume["_doc"], image: imageURL})
})