const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const VolumeSchema = new Schema({
    number: {type: Number, required: true},
    imageSRC: {type: String, required: true},
    link: {type: String},
    publisher: {type: String},
    title: {type: String}
});

module.exports = mongoose.model("Volume", VolumeSchema);