const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {type: String},
    email: {type: String, required: true},
    password: {type: String, required: true},
    userList: [
        {
            SeriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Series', required: true },
            completionPercentage: { type: Number, default: 0 },
        }
    ],
    ownedVolumes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Volume' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

module.exports = mongoose.model("User", UserSchema);