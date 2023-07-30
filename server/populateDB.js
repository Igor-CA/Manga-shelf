const fs = require('fs')
const jsonFile = fs.readFileSync('C:\\Users\\gabri\\OneDrive\\Área de Trabalho\\DataBase start\\allVolumesSorted.json')
const allVolumes = JSON.parse(jsonFile)
console.log("Populates DB with volumes");

const userArgs = process.argv.slice(2);

const Volume = require("./models/volume");
const Series = require("./models/Series")


const mongoose = require("mongoose");
mongoose.set("strictQuery", false); 

const mongoDB = userArgs[0];

main().catch((err) => console.log(err));

async function main() {
  console.log("Debug: About to connect");
  await mongoose.connect(mongoDB);
  console.log("Debug: Should be connected?");
  await addAllData();
  console.log("Debug: Closing mongoose");
  mongoose.connection.close();
}

async function addData(jsonObj){
  //Try search for existing series  
  console.log(`Trying to add ${jsonObj.title} volume ${jsonObj.volume}`)
  const existingSerie =  await Series.findOne({
    title: jsonObj.title,
    publisher: jsonObj.publisher
  })
  if(existingSerie){
    const serieDetail = {
      _id: existingSerie._id,
      title: existingSerie.title,
      authors: (Array.isArray(jsonObj.authors) && jsonObj.authors.length > 0)? [...jsonObj.authors]: [...existingSerie.authors],
      publisher: existingSerie.publisher,
      volumes: [...existingSerie.volumes]
    }
    await Series.findByIdAndUpdate(existingSerie._id, serieDetail, {})
    console.log(`Serie already exist if needed got updated`)
    const existingVolume =  await Volume.findOne({
      serie: existingSerie._id,
      number: +jsonObj.volume
    })
    if(existingVolume){
      const volumeDetail = {
        _id: existingVolume._id,
        serie: existingVolume.serie,
        number: existingVolume.number,
        pagesNumber: (jsonObj.pages)? jsonObj.pages: existingVolume.pagesNumber,
        date: (jsonObj.date)? jsonObj.date: existingVolume.date,
        summary: (Array.isArray(jsonObj.summary) && jsonObj.summary.length > 0)? [...jsonObj.summary]: [...existingVolume.summary],
        defaultPrice: (jsonObj.preço)? jsonObj.preço: existingVolume.defaultPrice
      }
      await Volume.findByIdAndUpdate(existingVolume._id, volumeDetail, {})
      console.log(`Volume already exist if needed got updated`)
    }else{
      //Add volume to series
      const volumeDetail = {
        serie: existingSerie._id,
        number: jsonObj.volume,
        pagesNumber: jsonObj.pages,
        date: jsonObj.date, //
        summary: jsonObj.summary
      }
      const newVolume = await Volume.create(volumeDetail)
      existingSerie.volumes.push(newVolume._id)
      await existingSerie.save()
      console.log(`Collection ${jsonObj.title} already exists, added volume ${jsonObj.volume} to it`)
    }
  }else{
    const seriesDetail = {
      title: jsonObj.title,
      authors: jsonObj.authors,
      publisher: jsonObj.publisher,
      volumes: []
    }
    const newSeries = await Series.create(seriesDetail)
    console.log(`Collection ${jsonObj.title} created`)
    const volumeDetail = {
      serie: newSeries._id,
      number: jsonObj.volume,
      pagesNumber: jsonObj.pages,
      date: jsonObj.date, //
      summary: jsonObj.summary
    }
    const newVolume = await Volume.create(volumeDetail)
    newSeries.volumes.push(newVolume._id)
    await newSeries.save()
    console.log(`added volume ${jsonObj.volume} to ${jsonObj.title} collection`)
  }
}

async function addAllData() {
  console.log("Adding data");
  for (volume of allVolumes){
    await addData(volume);
  }
}
