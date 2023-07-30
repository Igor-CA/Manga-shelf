const series = require("../models/Series")
const volumes = require("../models/volume")
const asyncHandler = require("express-async-handler");

exports.all = asyncHandler(async(req, res, next) => {
    const page = (req.query.p)?+req.query.p:1
    const step = 24
    const values = await series.find({}, "title").skip(step*(page-1)).limit(step).exec()
    const returnedValues = values.map(serie => {
        const sanitizedTitle = serie.title.replaceAll(/[?:/–\s]+/g, '-').replaceAll(/-+/g, '-');
        const nameURL = encodeURIComponent(sanitizedTitle)
        const imageURL = `http://${process.env.HOST_ORIGIN}:3001/images/cover-${nameURL}-1.jpg`;
        return {...serie["_doc"], image: imageURL}
    })
    res.send(returnedValues)
})

exports.searchSeries = asyncHandler(async(req, res, next) => {
    const query = req.query.q
    const values = await series.aggregate([{
        $search: {
          index: "SeriesSearchIndex",
          compound: {
            "should": [{
              "text": {
                "query": query,
                "path": "authors",
                "fuzzy":{}
              },
            },
            {
              "text": {
                "query": query,
                "path": "title",
                "fuzzy":{},
                "score": { "boost": { "value": 2 } }
              }
            }]
          },
        },
      },
      {
        $project: {
            title: 1, // Include only the "title" field in the output
        }
      }
    ]).limit(12).exec()
    const returnedValues = values.map(serie => {
        const sanitizedTitle = serie.title.replaceAll(/[?:/–\s]+/g, '-').replaceAll(/-+/g, '-');
        const nameURL = encodeURIComponent(sanitizedTitle)
        const imageURL = `http://${process.env.HOST_ORIGIN}:3001/images/cover-${nameURL}-1.jpg`;
        return {...serie, image: imageURL}
    })
    res.send(returnedValues)
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
            const nameURL = encodeURIComponent(sanitizedTitle)
            const fileName = `cover-${nameURL}-${volume.number}.jpg`;
            return(
                {
                    volumeId: volume._id,
                    volumeNumber: volume.number,
                    image: `http://${process.env.HOST_ORIGIN}:3001/images/${fileName}`
                }
            )  
        })
    }
    res.send(jsonResponse)
})