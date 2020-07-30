const users = require('../lib/redis-clients').users;
const randInt = require('../lib/prng').randInt;
const randomSlogan = require('../lib/utils').randomSlogan;
const privateclient = require('../lib/redis-clients').privateclient;
const config = require('../config');
const Playlist = require("../models/playlist");
const rooms = require('../lib/rooms').rooms
const Room = require("../lib/rooms").room

exports.choosePlaylist = async function(req, res) {
    const publicPlaylists = Object.values(rooms).map((r) => r.roomname)
    const userPlaylists = await Playlist.find({username: req.session.user}).exec()
    const mappedPlaylists = userPlaylists.map(playlist => playlist.name).concat(publicPlaylists);
    res.render('playlistSelection',{loggedin: req.session.user,
        user:req.session.user,
        slogan: randomSlogan(),
        playlists: mappedPlaylists
      });
}
exports.postRoomParams = function(req, res) {

    let {playlist,noOfPlayers,noOfSongs} = req.body;
    console.log("PLAYLIST = ", playlist)
    let max = 1000000
    let room = randInt(max);
    let pincode = randInt(max);
    let roomID = randInt(max)
    privateclient.hmset(`${room}`,["pincode", pincode, "playlist", playlist.replace(/\s/g, ""), "creator", req.session.user, "roomID",roomID ], function(err, ok) {
      rooms[roomID] = new Room(playlist, roomID, true)
      res.redirect('/privateroom/waiting/'+ room + '/' + pincode);
    })
}
exports.waitingRoom = function(req, res) {
      let { room,pincode } = req.params;
      console.log("REQ PARAMS = ", req.params)
      res.render('waitingRoom',{
          loggedin: req.session.user,
          room:room,
          pincode:pincode,
          user:req.session.user,
          slogan: randomSlogan()
      });
}
exports.joinPrivateroom = function(req, res) {

    res.render('joinPrivate',{
      loggedin: req.session.user,
      slogan: randomSlogan(),
    });
}

exports.joinPrivateroomPost = function(req, res) {
  if (!req.body.room || !req.body.pincode) return res.redirect("/privateroom/join")
  privateclient.hgetall(req.body.room, function(err, value) {
    if(value == null) return res.redirect("/privateroom/join")
    if (value.pincode === req.body.pincode) {
      return res.redirect("/privateroom/waiting/" + req.body.room + "/" + req.body.pincode)
    } else {
      res.redirect("/privateroom/join")
    }
  })
}
exports.privateRoom = function(req, res) {

    res.render('privateRoom',{
          user:req.session.user,
          slogan: randomSlogan()
    });
}
