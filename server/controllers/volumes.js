const series = require("../models/Series")
const volume = require("../models/volume")
const asyncHandler = require("express-async-handler");

exports.all = asyncHandler(async(req, res, next) => {
    const page = req.query.p ? Number(req.query.p) : 0;
    const step = 10
    
    const volumes = await volume.find({}, "number")
        .populate("serie", "title")
        .skip(step*page)
        .limit(step)
        .exec();

    res.send(volumes);
})


exports.getVolumeDetails = asyncHandler(async(req, res, next) => {
    const desiredVolume = await volume.findById(req.params.id)
        .populate("serie", "title")
        .exec();

    const { serie, number } = desiredVolume;

    const sanitizedTitle = serie.title.replace(/[?:/–\s]+/g, '-').replace(/-+/g, '-');
    const nameURL = encodeURIComponent(sanitizedTitle)
    
    const imageURL = `http://${process.env.HOST_ORIGIN}:3001/images/cover-${nameURL}-${number}.jpg`;
    
    res.send({...desiredVolume._doc, image: imageURL})
})