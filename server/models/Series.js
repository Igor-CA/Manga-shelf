require('dotenv').config()
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SeriesSchema = new Schema({
    title: {type: String, required: true},
    authors: [{type: String}],
    publisher: { type: String, required: true },
    volumes: [{type: Schema.Types.ObjectId, ref: "Volume", required:true}]
});

SeriesSchema.virtual("firsVolumeImage").get(function () {
    const sanitizedTitle = this.title.replaceAll(/[?:/–\s]+/g, '-').replaceAll(/-+/g, '-');
    const nameURL = encodeURIComponent(sanitizedTitle)
    const fileName = `cover-${nameURL}-1.jpg`
    return `http://${process.env.HOST_ORIGIN}:3001/images/${fileName}`;
});

module.exports = mongoose.model("Series", SeriesSchema);