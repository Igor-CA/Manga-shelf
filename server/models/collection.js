const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ColletionSchema = new Schema({
    title: {type: String, required: true},
    publisher: {
        type: String,
        required: true,
        enum: ["Panini", "JBC", "NewPOP"]
    },
    language: {
        type: String,
        default: "PT-BR"
    },
    volumes: [{type: Schema.Types.ObjectId, ref: "Volumes", required:true}]
});

module.exports = mongoose.model("Collection", ColletionSchema);