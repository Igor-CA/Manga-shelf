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
    res.send(desiredVolume)
})