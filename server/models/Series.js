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
    const sanitizedTitle = this.title.replace(/[?:/–\s]+/g, '-').replace(/-+/g, '-');
    const nameURL = encodeURIComponent(sanitizedTitle)
    return `http://${process.env.HOST_ORIGIN}:3001/images/cover-${nameURL}-1.jpg`;
});

SeriesSchema.set('toObject', { virtuals: true });
SeriesSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model("Series", SeriesSchema);