'use strict';

const config = require('../config');
const db = require('./redis-clients').users;
const privateclient = require("./redis-clients").privateclient
const fs = require('fs');
const Primus = require('primus');
const primusemitter = require('primus-emitter');
const primusrooms = require('primus-rooms');
// const rooms = require('./rooms').rooms;
const uglify = require('uglify-js');
const utils = require('./utils');
const rooms = require("./rooms").rooms
const Playlist = require("../models/playlist")
const banDuration = utils.banDuration;
const isFunction = utils.isFunction;
const isString = utils.isString;
const sparks = Object.create(null); // Sparks of all rooms
const sparks2 = Object.create(null)
let primus;
let primus2;
let sessionstore;

/**
 * Expose a function to set up Primus.
 */

module.exports = function(options) {
  sessionstore = options.sessionstore;

  // Create Primus instance
  primus = new Primus(options.server, {
    authorization: authorize,
    maxLength: 1024,
    plugin: {
      emitter: primusemitter,
      rooms: primusrooms
    },
    rooms: { wildcard: false },
    transformer: 'websockets'
  });
  primus2 = new Primus(options.waitingRoomServer, {
    authorization: authorize,
    maxLength: 1024,
    plugin: {
      emitter: primusemitter,
      rooms: primusrooms
    },
    rooms: { wildcard: false },
    transformer: 'websockets'
  });
  // Remove unneeded middleware
  ['cors', 'no-cache', 'primus.js', 'spec', 'x-xss'].forEach(function(
    middleware
  ) {
    primus.remove(middleware);
    primus2.remove(middleware)
  });

  // Add cookieParser middleware
  primus.use('cookies', options.parser, 0);
  primus2.use('cookies', options.parser, 0)
  primus2.on('connection', waitingRoomConnection);
  primus2.on('joinroom', joinWaitingRoom);
  primus.on('connection', connection);
  primus.on('joinroom', joinRoom);
  primus.on('log', function(type) {
    if (type === 'error') {
      const err = arguments[1];
      console.error(err.stack || err.message);
    }
  });

  // Minify and store the client-side library in the public directory
  const library = uglify.minify(primus.library());
  fs.writeFileSync(__dirname + '/../public/js/primus.min.js', library.code);

  return { primus: primus, sparks: sparks };
};

/**
 * Authorization handler.
 */

function authorize(req, authorized) {
  const cookies = req.signedCookies;
  if (!cookies['connect.sid']) {
    const err = new Error('connect.sid cookie not transmitted');
    console.error(err.message);
    return authorized(err);
  }
  sessionstore.get(cookies['connect.sid'], function(err, session) {
    if (err || !session) {
      err = err || new Error('session not found');
      console.error(err.message);
      return authorized(err);
    }
    db.exists(['ban:' + req.forwarded.ip], function(err, exists) {
      if (err) {
        console.error(err.message);
        return authorized(err);
      }
      if (exists) {
        return authorized(new Error('banned IP address'));
      }
      req.user = session.user;
      authorized();
    });
  });
}

/**
 * Handle `connection` event.
 */
var waitingRooms = {}
// check if an element exists in array using a comparer function
// comparer : function(currentElement)
Array.prototype.inArray = function(comparer) {
    for(var i=0; i < this.length; i++) {
        if(comparer(this[i])) return true;
    }
    return false;
};

// adds an element to the array if it does not already exist using a comparer
// function
Array.prototype.pushIfNotExist = function(element, comparer) {
    if (!this.inArray(comparer)) {
        this.push(element);
    }
};
const msgMap = {};
function joinWaitingRoom(room, spark2) {

  if (!msgMap.hasOwnProperty(room)) {
    msgMap[room] = []
  }
  if (spark2.query.roomId && spark2.query.pin) {
      var roomId = spark2.query.roomId;
  }
  spark2.on("trystartingroom", function(data) {
    privateclient.hgetall(data.roomId, function(err, res) {
      if (res.creator === data.currUser) {
        rooms[res.roomID].initPrivate();
        spark2.room(data.roomId).write({method: "start", playlist: res.roomID})
      }
    })
  })

  spark2.on("waitingroommsg", function(data) {
    let msg = {user: data.user, msg: data.msg}
    msgMap[room].push(msg)
    spark2.room(roomId).write({method: 'chat', msgs: msgMap[room]})
  })
  spark2.on("userisleavingwaitingroom", function(user) {
      console.log("user is leaving == ",user)
      spark2.room(roomId).write({method:'userleftwaitingroom', user});
  })
}
function waitingRoomConnection(spark2) {
  const user = spark2.request.user;

  if (spark2.query.roomId && spark2.query.pin) {
      var roomId = spark2.query.roomId;
      var pin = spark2.query.pin
  }
  if (roomId && pin) {
    if (waitingRooms[roomId]) {
      waitingRooms[roomId].pushIfNotExist(user, function(e) { return e === user})
    } else {
      waitingRooms[roomId] = [user]
    }
    spark2.on('updatewaitingusers', function(data) {
        console.log("inside join")
        spark2.join(roomId, function() {
          console.log("join callback")
          var strData = waitingRooms[roomId].toString()
          console.log(strData)
          spark2.room(roomId).write({method: 'join', users: waitingRooms[roomId]})

        })
    })
  }
}
function connection(spark) {
  const nickname = spark.request.cookies.nickname;
  const user = spark.request.user;
  //check if room is defined
  if (!spark.query.roomID) return;
  // var room = spark.query.room.replace(/\s/g, "");
  var roomID = spark.query.roomID
  console.log("ROOMID = ",roomID)
  let data = {};
  spark.send(
    'overview',
    Object.values(rooms).reduce(function(data, r) {
        data[roomID] = rooms[roomID].totusers;
        return data;
    }, {})
  );

  if (roomID === undefined) return;
  if (user) {
    if (sparks[user]) {
      // User already in a room
      spark.send('alreadyinaroom');
    } else {
      spark.nickname = user;
      spark.join(roomID, function() {
        rooms[roomID].addUser(spark, true);
      });
    }
  } else {
    if (isString(nickname)) {
      rooms[roomID].join(spark, nickname);
    } else {
      spark.send('nickname');
    }

    spark.on('nickname', function(nickname) {
      if (isString(nickname)) {
        rooms[roomID].join(spark, nickname);
      }
    });
  }
}

/**
 * Handle `joinroom` event.
 */

function joinRoom(room, spark) {

  room = rooms[room];

  spark.on('ban', function(who, why, duration, callback) {
    if (
      isString(who) &&
      isString(why) &&
      isString(duration) &&
      isFunction(callback)
    ) {
      room.onKick(who, why, spark.nickname, banDuration(duration), callback);
    }
  });
  spark.on('chatmsg', function(msg, to) {
    if (isString(msg)) {
      room.onChatMessage(msg, spark, to);
    }
  });
  spark.on('guess', function(guess) {
    if (isString(guess)) {
      room.onGuess(spark, guess);
    }
  });
  spark.on('ignore', function(who, callback) {
    if (isString(who) && isFunction(callback)) {
      room.onIgnore(who, spark.nickname, callback);
    }
  });
  spark.on('kick', function(who, why, callback) {
    if (isString(who) && isString(why) && isFunction(callback)) {
      room.onKick(who, why, spark.nickname, callback);
    }
  });
  spark.on('leaveallrooms', function() {
    room.removeUser(spark.nickname);
  });
  spark.on('unban', function(ip, callback) {
    if (isString(ip) && isFunction(callback)) {
      utils.unban(ip, spark, callback);
    }
  });
  spark.on('unignore', function(who) {
    if (isString(who)) {
      room.onUnignore(who, spark.nickname);
    }
  });
}
