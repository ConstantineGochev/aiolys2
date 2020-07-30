const fs = require("fs")
const mongoose = require("mongoose")
const util = require("util");
const read_file = util.promisify(fs.readFile);
const randInt = require('./lib/prng').randInt;
// Connect MongoDB
fs.writeFile("public_rooms.json", '[]', function() {console.log("Done handling file")})
mongoose
  .connect("mongodb+srv://Admin:B2muUhCFT7tArmr@cluster0-ul3gt.gcp.mongodb.net/rap?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("mongoDB connection successfull from init script");
    const Playlist = require("./models/playlist")
    Playlist.find({}, function(err, playlists) {
        var publicRooms = []
        playlists.forEach(function(pl) {
          if (pl.type === 'public') {
            let roomID = randInt(10000)
            console.log(pl.name)
            let roomData = {"name": pl.name, "roomID":roomID}
            publicRooms.push(roomData)
          }
        })
        fs.writeFile("public_rooms.json", JSON.stringify(publicRooms), function() {
          console.log("DONE")
          process.exit()
        })
    })
});
