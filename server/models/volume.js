const mongoose = require("mongoose");
const series = require("../models/Series")
const Schema = mongoose.Schema;

const VolumeSchema = new Schema({
    serie: {type: Schema.Types.ObjectId, ref: "Series"},
    number: {type: Number, required: true},
    pagesNumber: {type: Number},
    date: {type: String},
    summary: [{type: String}], //Separated by paragraphs
    defaultPrice: {type: String}
});

VolumeSchema.set('toObject', { virtuals: true });
VolumeSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model("Volume", VolumeSchema);