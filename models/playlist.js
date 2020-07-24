const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "please tell us name of Playlist"],
        min: 3,
        max: 20
    },
    username: {
        type: String,
        required: [true, "please tell us who created the playlist"],
        min: 3,
        max: 20
    },
    type: {
        type: String,
        enum:['public' , 'private'],
        default:'private'
        
    },
    listAdded:[{
        type: Object
    }]
});

const playList = mongoose.model("playlist", playlistSchema);
module.exports = playList;