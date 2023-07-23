const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const VolumeSchema = new Schema({
    serie: {type: Schema.Types.ObjectId, ref: "Series"},
    number: {type: Number, required: true},
    pagesNumber: {type: Number},
    date: {type: String},
    summary: [{type: String}], //Separated by paragraphs
    defaultPrice: {type: String}
});

VolumeSchema.virtual("firsVolumeImage").get(function () {
    const seriesTitle = this.serie.title
    const sanitizedTitle = seriesTitle.replaceAll(/[?:/–\s]+/g, '-').replaceAll(/-+/g, '-');
    const fileName = `cover-${sanitizedTitle}-${this.number}.jpg`
    return `images/${fileName}`;
});

module.exports = mongoose.model("Volume", VolumeSchema);