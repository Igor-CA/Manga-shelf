const series = require("../models/Series")
const volumes = require("../models/volume")
const asyncHandler = require("express-async-handler");

exports.all = asyncHandler(async(req, res, next) => {
  const page = (req.query.p) ? Number(req.query.p) : 1
  const step = 24
  const values = await series.find({}, "title")
    .skip(step*(page-1))
    .limit(step)
    .exec()
  
  const seriesPage = values.map(serie => {
    const imageURL = serie.firstVolumeImage;
    return {...serie._doc, image: imageURL}
  })
  res.send(seriesPage)
})

exports.searchSeries = asyncHandler(async(req, res, next) => {
  const query = req.query.q
  const values = await series.aggregate([{
    $search: {
      index: "SeriesSearchIndex",
      compound: {
        "should": [
        {
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
        }
        ]
      },
    },
  },
  {
    $project: {
      title: 1,
    }
  }
  ]).limit(12).exec()
  const searchResults = values.map(serie => {
    const sanitizedTitle = serie.title.replace(/[?:/–\s]+/g, '-').replace(/-+/g, '-');
    const nameURL = encodeURIComponent(sanitizedTitle)
    const imageURL = `${process.env.HOST_ORIGIN}/images/cover-${nameURL}-1.jpg`;
    return {...serie, image: imageURL}
  })
  res.send(searchResults)
})

exports.getSeriesDetails = asyncHandler(async(req, res, next) => {
  const desiredSeries = await series.findById(req.params.id).populate("volumes").exec()
  
  const jsonResponse = {
    id: desiredSeries._id,
    title: desiredSeries.title,
    authors: desiredSeries.authors,
    publisher: desiredSeries.publisher,
    seriesCover: desiredSeries.firstVolumeImage,
    volumes: desiredSeries.volumes.map(volume => {
      const sanitizedTitle = desiredSeries.title.replace(/[?:/–\s]+/g, '-').replace(/-+/g, '-');
      const nameURL = encodeURIComponent(sanitizedTitle)
      const fileName = `cover-${nameURL}-${volume.number}.jpg`;
      return(
        {
            volumeId: volume._id,
            volumeNumber: volume.number,
            image: `${process.env.HOST_ORIGIN}/images/${fileName}`
        }
      )  
    })
  }
    res.send(jsonResponse)
})    