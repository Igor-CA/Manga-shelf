const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SeriesSchema = new Schema({
    title: {type: String, required: true},
    authors: [{type: String}],
    publisher: { type: String, required: true },
    volumes: [{type: Schema.Types.ObjectId, ref: "Volumes", required:true}]
});

SeriesSchema.virtual("firsVolumeImage").get(function () {
    const sanitizedTitle = this.title.replaceAll(/[?:/–\s]+/g, '-').replaceAll(/-+/g, '-');
    const fileName = `cover-${sanitizedTitle}-1.jpg`
    return `images/${fileName}`;
});

module.exports = mongoose.model("Series", SeriesSchema);