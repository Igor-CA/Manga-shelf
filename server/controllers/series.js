const series = require("../models/Series")
const volumes = require("../models/volume")
const asyncHandler = require("express-async-handler");

exports.all = asyncHandler(async(req, res, next) => {
    const page = (req.query.p)?+req.query.p:0
    const step = 10
    const values = await series.find({}, "title").populate("volumes", "number").skip(step*page).limit(step).exec()
    res.send(values)
})

exports.getSeriesDetails = asyncHandler(async(req, res, next) => {
    const desiredSerie = await series.findById(req.params.id).populate("volumes").exec()
    const jsonResponse = {
        id: desiredSerie._id,
        title: desiredSerie.title,
        authors: desiredSerie.authors,
        publisher: desiredSerie.publisher,
        seriesCover: desiredSerie.firsVolumeImage,
        volumes: desiredSerie.volumes.map(volume => {
            const sanitizedTitle = desiredSerie.title.replaceAll(/[?:/–\s]+/g, '-').replaceAll(/-+/g, '-');
            const fileName = `cover-${sanitizedTitle}-${volume.number}.jpg`;
            return(
                {
                    volumeId: volume._id,
                    volumeNumber: volume.number,
                    image: `images/${fileName}`
                }
            )  
        })
    }
    res.send(jsonResponse)
})