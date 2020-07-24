const users = require('../lib/redis-clients').users;
const randInt = require('../lib/prng').randInt;
const randomSlogan = require('../lib/utils').randomSlogan;
const rooms = require('../lib/rooms').rooms;
const privateclient = require('../lib/redis-clients').privateclient;
const config = require('../config');
const Playlist = require("../models/playlist");

exports.choosePlaylist = async function(req, res) {
    const playlist = await Playlist.find({$or:[{type: "public"}, {username: req.session.user}]}).exec()
    const mappedPlaylists = playlist.map(playlist => playlist.name);

    res.render('playlistSelection',{loggedin: req.session.user,
        user:req.session.user,
        slogan: randomSlogan(),
        playlists: mappedPlaylists
      });
}
exports.postRoomParams = function(req, res) {

    let {playlist,noOfPlayers,noOfSongs} = req.body;
    let max = 1000000
    let room = randInt(max);
    let pincode = randInt(max);

    privateclient.hmset(`${room}`,["pincode", pincode, "playlist", playlist.replace(/\s/g, ""), "creator", req.session.user], function(err, ok) {
      res.redirect('/privateroom/waiting/'+ room + '/' + pincode);
    })
}
exports.waitingRoom = function(req, res) {
      let { room,pincode } = req.params;
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
  privateclient.hgetall(req.body.room, function(err, value) {
    if (value.pincode === req.body.pincode) {
      res.redirect("/privateroom/waiting/" + req.body.room + "/" + req.body.pincode)
    }
  })
}
exports.privateRoom = function(req, res) {

    res.render('privateRoom',{
          user:req.session.user,
          slogan: randomSlogan()
    });
}
