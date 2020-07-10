const mongoose = require("mongoose");

const chooseSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: [true, "please tell us Username "]
    },

    playlistName: {
        type: String,
        required: [true, "please tell us name of Playlist"]
    },
    playlistID: {
        type: String
    },
});

const choose = mongoose.model("choose", chooseSchema);
module.exports = choose;