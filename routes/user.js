'use strict';

const crypto = require('crypto');
const db = require('../lib/redis-clients').users;
const JSONStream = require('JSONStream');
const http = require('http');
const mailer = require('../lib/email/mailer');
const rooms = require('../lib/rooms').rooms;
var privateclient = require("../lib/redis-clients").privateclient
const _ = require("lodash")
const User = require('../lib/user');
const utils = require('../lib/utils');
const parser = JSONStream.parse(['results', true]);
const rc = require('redis').createClient();
const axios = require("axios");
const Playlist = require("../models/playlist")
let songId = 0;
let score;
let skip = 0;
/**
 * Populate the whitelist of follow-up URLs.
 */

const safeurls = ['/', '/changepasswd'];
// for (let i = 0; i < rooms.length; i++) {
//   safeurls.push('/' + rooms[i]);
// }

// Create Play List

exports.createPlayList = async (req, res) => {

    const playList = await Playlist.find({username: req.session.user}).exec()

    res.render('createPlayList', { loggedin: req.session.user , playList });

}

// choose playList

exports.choosePublicRoom = async (req , res ) => {

    res.render('choosePublicRoom', { loggedin: req.session.user, publicRooms:rooms });
}


/**
 * Show two lists of users, one ordered by points and one by best guess time (limit set to 30).
 */

exports.leaderboards = function(req, res, next) {
  db.zrevrange(['users', 0, 29, 'withscores'], function(err, pointsresults) {
    if (err) {
      return next(err);
    }
    db.sort(utils.sortParams(0), function(err, timesresults) {
      if (err) {
        return next(err);
      }
      const leaderboards = utils.buildLeaderboards(pointsresults, timesresults);
      res.locals.slogan = utils.randomSlogan();
      res.render('leaderboards', leaderboards);
    });
  });
};


exports.playlist = function(req, res, next) {
  rc.get(req.session.user+'pn',function(err, reply) {
    console.log("in get key");


      if(reply==null)
        {
          playlist_names=[];
        }
        else{
          playlist_names=JSON.parse(reply);
        }
    });
    rc.get(req.session.user+'ps',function(err, reply) {
      console.log("in get key");


        if(reply==null)
        {
          playlist_songs=[];
        }
        else{
          playlist_songs=JSON.parse(reply);
        }
        res.locals.slogan = utils.randomSlogan();
      res.render('playlist',{
        // playlist_names:playlist_names,
        loggedin: req.session.user
        // playlist_songs:playlist_songs
      });
      });

};
/**
 * Get 30 users from the ranking, starting at index `begin`.
 */

exports.sliceLeaderboard = function(req, res, next) {
  const begin = parseInt(req.query.begin, 10);
  const by = req.query.by;
  if (isNaN(begin) || begin > 180 || (by !== 'points' && by !== 'times')) {
    return res.status(400).send(http.STATUS_CODES[400]);
  }
  const end = begin + 29;
  if (by === 'points') {
    db.zrevrange(['users', begin, end, 'withscores'], function(err, results) {
      if (err) {
        return next(err);
      }
      res.send(results);
    });
    return;
  }
  db.sort(utils.sortParams(begin), function(err, results) {
    if (err) {
      return next(err);
    }
    res.send(results);
  });
};

/**
 * Change password middlewares.
 */

exports.validateChangePasswd = function(req, res, next) {
  if (
    !req.session.user ||
    req.body.oldpassword === undefined ||
    req.body.newpassword === undefined
  ) {
    return res.status(400).send(http.STATUS_CODES[400]);
  }

  const errors = {};

  if (req.body.oldpassword.trim() === '') {
    errors.oldpassword = "can't be empty";
  }
  if (req.body.newpassword.trim() === '') {
    errors.newpassword = "can't be empty";
  } else if (req.body.newpassword.length < 6) {
    errors.newpassword = 'must be at least 6 characters long';
  } else if (req.body.newpassword === req.body.oldpassword) {
    errors.newpassword = "can't be changed to the old one";
  }

  if (errors.oldpassword || errors.newpassword) {
    req.session.errors = errors;
    return res.redirect(req.url);
  }

  next();
};

exports.checkOldPasswd = function(req, res, next) {
  const key = 'user:' + req.session.user;
  db.hmget([key, 'salt', 'password'], function(err, data) {
    if (err) {
      return next(err);
    }

    const digest = crypto
      .createHash('sha256')
      .update(data[0] + req.body.oldpassword)
      .digest('hex');

    if (digest !== data[1]) {
      req.session.errors = { oldpassword: 'is incorrect' };
      return res.redirect(req.url);
    }
    next();
  });
};

exports.changePasswd = function(req, res, next) {
  const followup = ~safeurls.indexOf(req.query.followup)
    ? req.query.followup
    : '/';
  const user = req.session.user;
  const key = 'user:' + user;
  const salt = crypto.randomBytes(6).toString('base64');
  const digest = crypto
    .createHash('sha256')
    .update(salt + req.body.newpassword)
    .digest('hex');

  db.hmset([key, 'salt', salt, 'password', digest], function(err) {
    if (err) {
      return next(err);
    }
    // Regenerate the session
    req.session.regenerate(function() {
      req.session.cookie.maxAge = 604800000; // One week
      req.session.user = user;
      res.redirect(followup);
    });
  });
};

/**
 * Login middlewares.
 */

exports.validateLogin = function(req, res, next) {
  if (req.body.username === undefined || req.body.password === undefined) {
    return res.status(400).send(http.STATUS_CODES[400]);
  }

  const errors = {};

  if (req.body.username.trim() === '') {
    errors.username = "can't be empty";
  }
  if (req.body.password.trim() === '') {
    errors.password = "can't be empty";
  }

  req.session.oldvalues = { username: req.body.username };
  if (errors.username || errors.password) {
    req.session.errors = errors;
    return res.redirect(req.url);
  }
  next();
};
exports.requireAuth = function(req, res, next) {
  if(!req.session.user) {
    return res.redirect("/Login")
  }
    next()
}
exports.checkUser = function(req, res, next) {
  const key = 'user:' + req.body.username;
  db.exists([key], function(err, exists) {
    if (err) {
      return next(err);
    }
    if (exists) {
      // User exists, proceed with authentication
      return next();
    }
    req.session.errors = {
      alert: 'The username you specified does not exists.'
    };
    res.redirect(req.url);
  });
};

exports.authenticate = function(req, res, next) {
  const key = 'user:' + req.body.username;
  db.hmget([key, 'salt', 'password'], function(err, data) {
    if (err) {
      return next(err);
    }

    const digest = crypto
      .createHash('sha256')
      .update(data[0] + req.body.password)
      .digest('hex');

    if (digest === data[1]) {
      const followup = ~safeurls.indexOf(req.query.followup)
        ? req.query.followup
        : '/';
      // Authentication succeeded, regenerate the session
      req.session.regenerate(function() {
        req.session.cookie.maxAge = 604800000; // One week
        req.session.user = req.body.username;
        res.redirect(followup);
      });
      return;
    }
    req.session.errors = {
      alert: 'The password you specified is not correct.'
    };
    res.redirect(req.url);
  });
};

/**
 * Logout the user.
 */

exports.logout = function(req, res) {
  // Destroy the session
  req.session.destroy(function() {
    res.redirect('/');
  });
};

/**
 * Sign up middlewares.
 */

exports.validateSignUp = function(req, res, next) {
  if (
    req.body.username === undefined ||
    req.body.email === undefined ||
    req.body.password === undefined ||
    req.body.captcha === undefined
  ) {
    return res.status(400).send(http.STATUS_CODES[400]);
  }

  const errors = {};

  if (req.body.username === 'binb') {
    errors.username = 'is reserved';
  } else if (!utils.isUsername(req.body.username)) {
    errors.username = 'must contain only alphanumeric characters';
  }
  if (!utils.isEmail(req.body.email)) {
    errors.email = 'is not an email address';
  }
  if (req.body.password.trim() === '') {
    errors.password = "can't be empty";
  } else if (req.body.password.length < 6) {
    errors.password = 'must be at least 6 characters long';
  }
  if (req.body.captcha !== req.session.captchacode) {
    errors.captcha = 'no match';
  }

  // Save old values to repopulate the fields in case of future errors
  req.session.oldvalues = {
    username: req.body.username,
    email: req.body.email
  };

  if (errors.username || errors.email || errors.password || errors.captcha) {
    req.session.errors = errors;
    return res.redirect(req.url);
  }

  next();
};

exports.userExists = function(req, res, next) {
  const key = 'user:' + req.body.username;
  db.exists([key], function(err, exists) {
    if (err) {
      return next(err);
    }
    if (exists) {
      // User already exists
      req.session.errors = { alert: 'A user with that name already exists.' };
      return res.redirect(req.url);
    }
    next();
  });
};

exports.emailExists = function(req, res, next) {
  const key = 'email:' + req.body.email;
  db.exists([key], function(err, exists) {
    if (err) {
      return next(err);
    }
    if (exists) {
      // Email already exists
      req.session.errors = { alert: 'A user with that email already exists.' };
      return res.redirect(req.url);
    }
    next();
  });
};

const updateRooms = function(artistId) {
  rooms = ['mixed'];
  score = 0;
  if (artistId === popIds[0]) {
    rooms.push('hits', 'pop');
    // Set the skip counter (there is no need to update the rooms for the next pop artists)
    skip = popIds.length - 1;
  } else if (artistId === rapIds[0]) {
    rooms.push('rap');
    skip = rapIds.length - 1;
  } else {
    rooms.push('oldies', 'rock');
    skip = rockIds.length - 1;
  }
};

const updateRoomsUsingGenre = function(genre) {
  rooms = ['mixed'];
  score = 0;
  if (genre === popIds[0]) {
    rooms.push('hits', 'pop');
    // Set the skip counter (there is no need to update the rooms for the next pop artists)
    skip = popIds.length - 1;
  } else if (genre === rapIds[0]) {
    rooms.push('rap');
    skip = rapIds.length - 1;
  } else {
    rooms.push('oldies', 'rock');
    skip = rockIds.length - 1;
  }
};

parser.on('data', function(track) {
  if (track.wrapperType === 'artist') {
    if (skip) {
      skip--;
      return;
    }
    updateRooms(track.artistId);
    return;
  }


  rc.hmset(
    'song:' + songId,
    'artistName',
    track.attributes.artistName,
    'trackName',
    track.attributes.name,
    'trackViewUrl',
    track.attributes.url,
    'previewUrl',
    track.attributes.previews[0].url,
    'artworkUrl60',
    track.attributes.artwork.url,
    'artworkUrl100',
    track.attributes.artwork.url
  );

  rooms.forEach(function(room) {
    const _score = room === 'mixed' ? songId : score;
    rc.zadd(room, _score, songId);
  });
  // rc.zadd(room, _score, songId);
  score++;
  songId++;
});

parser.on('end', function() {
  rc.quit();
  process.stdout.write('OK\n');
});
var playlist_songs=[];
var playlist_names=[];
exports.insertPlaylist = function(req,res,next){

const axios = require('axios');
playlist_names.push({name:req.body.playlist_name});

// Make a request for a user with a given ID
axios.get('https://api.music.apple.com/v1/catalog/us/playlists/'+req.body.playlist_url,{
  headers: {'Authorization': 'Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkQyOTNRVlAyUTIifQ.eyJpYXQiOjE1OTIyNDI0NjAsImV4cCI6MTYwNzc5NDQ2MCwiaXNzIjoiVEhIWjJTNDJHVSJ9.Fa970C8oAuvo-_qkeHukyIK4xkjie6oOMiGj5hzc8dxoUDc25k6VDVhzNsBoKoUWskokhtQk0z2F3MCJrp-sQQ'}

})
  .then(function (response) {
    // handle success
    console.log("Got Responseeeeeeeeeeeeeeeee");
    console.log(req.session.user);


    //console.log(JSON.stringify(response.data.data[0].relationships.tracks.data) );

    response.data.data[0].relationships.tracks.data.forEach(track => {

      // if (track.wrapperType === 'artist') {
      //   if (skip) {
      //     skip--;
      //     return;
      //   }
      //   updateRooms(track.artistId);
      //   return;
      // }
      //console.log(track);
      rc.hmset(
        'song:' + songId,
        'artistName',
        track.attributes.artistName,
        'trackName',
        track.attributes.name,
        'trackViewUrl',
        track.attributes.url,
        'previewUrl',
        track.attributes.previews[0].url,
        'artworkUrl60',
        track.attributes.artwork.url,
        'artworkUrl100',
        track.attributes.artwork.url
      );
      playlist_songs.push({
        artistName:track.attributes.artistName,
        name:track.attributes.name
      });
      //rooms = ['pop'];
      // rooms.forEach(room => {
      //   const _score = room === track.attributes.genreNames[0] ? songId : score;
      //   rc.zadd(room, _score, songId);
      // });

    rc.zadd("hits", songId, songId);

      score++;
      songId++;

    });


    const redisValue = JSON.stringify(playlist_names);
rc.set(req.session.user+'pn', redisValue, function(err, reply) {
    console.log(reply);
});
const redisValue1 = JSON.stringify(playlist_songs);
rc.set(req.session.user+'ps', redisValue1, function(err, reply) {
  console.log(reply);
});
    // response.pipe(parser);


    res.render('playlist',{
      success:true,
      msg:"Playlist added Successfully",
      loggedin: req.session.user,
      playlist_names:playlist_names,
      playlist_songs: playlist_songs
    })
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  .finally(function () {
    // always executed
  });


// res.render('playlist',{
//   success:true,
//   msg:"Playlist added Successfully",
//   playlist_name:"Pop Music"
// })




  // req.session.errors = {
  //   alert: 'The password you specified is not correct.'
  // };
  //  console.log(req.url);
  //  req.session.errors = {
  //   alert: 'The password you specified is not correct.'
  // };
  // res.redirect(req.url);

}



exports.createAccount = function(req, res, next) {
  const mailkey = 'email:' + req.body.email;
  const salt = crypto.randomBytes(6).toString('base64');
  const userkey = 'user:' + req.body.username;
  const digest = crypto
    .createHash('sha256')
    .update(salt + req.body.password)
    .digest('hex');
  const date = new Date().toISOString();
  const user = new User(req.body.username, req.body.email, salt, digest, date);

  // Delete old fields values
  delete req.session.oldvalues;

  // Add new user in the db
  const multi = db.multi();
  multi.hmset(userkey, user);
  multi.set(mailkey, userkey);
  multi.zadd('users', 0, req.body.username);
  multi.sadd('emails', req.body.email);
  multi.exec(function(err) {
    if (err) {
      return next(err);
    }
    res.render('login', {
      followup: req.query.followup || '/',
      slogan: utils.randomSlogan(),
      success:
        'You successfully created your account. You are now ready to login.'
    });
  });
};

/**
 * Recover password middlewares.
 */

exports.validateRecoverPasswd = function(req, res, next) {
  if (req.body.email === undefined || req.body.captcha === undefined) {
    return res.status(400).send(http.STATUS_CODES[400]);
  }

  const errors = {};

  if (!utils.isEmail(req.body.email)) {
    errors.email = 'is not an email address';
  }
  if (req.body.captcha !== req.session.captchacode) {
    errors.captcha = 'no match';
  }

  req.session.oldvalues = { email: req.body.email };

  if (errors.email || errors.captcha) {
    req.session.errors = errors;
    return res.redirect(req.url);
  }

  next();
};

exports.sendEmail = function(req, res, next) {
  const key = 'email:' + req.body.email;
  db.get([key], function(err, data) {
    if (err) {
      return next(err);
    }
    if (data) {
      delete req.session.captchacode;
      delete req.session.oldvalues;
      // Email exists, generate a secure random token
      const token = crypto.randomBytes(48).toString('hex');
      // Token expires after 4 hours
      db.setex(['token:' + token, 14400, data], function(err) {
        if (err) {
          return next(err);
        }
        mailer.sendEmail(req.body.email, token, function(err) {
          if (err) {
            console.error(err.message);
          }
        });
        res.render('recoverpasswd', {
          followup: req.query.followup || '/',
          slogan: utils.randomSlogan(),
          success: true
        });
      });
      return;
    }
    req.session.errors = {
      alert: 'The email address you specified could not be found'
    };
    res.redirect(req.url);
  });
};

/**
 * Reset user password.
 */

exports.resetPasswd = function(req, res, next) {
  if (req.body.password === undefined) {
    return res.status(400).send(http.STATUS_CODES[400]);
  }

  const errors = {};

  // Validate new password
  if (req.body.password.trim() === '') {
    errors.password = "can't be empty";
  } else if (req.body.password.length < 6) {
    errors.password = 'must be at least 6 characters long';
  }
  // Check token availability
  if (!req.query.token) {
    errors.alert = 'Missing token.';
  }

  if (errors.password || errors.alert) {
    req.session.errors = errors;
    return res.redirect(req.url);
  }

  const key = 'token:' + req.query.token;
  db.get([key], function(err, user) {
    if (err) {
      return next(err);
    }
    if (user) {
      db.del(key); // Delete the token
      const salt = crypto.randomBytes(6).toString('base64');
      const digest = crypto
        .createHash('sha256')
        .update(salt + req.body.password)
        .digest('hex');

      db.hmset([user, 'salt', salt, 'password', digest], function(err) {
        if (err) {
          return next(err);
        }
        res.render('login', {
          followup: '/',
          slogan: utils.randomSlogan(),
          success: 'You can now login with your new password.'
        });
      });
      return;
    }
    req.session.errors = { alert: 'Invalid or expired token.' };
    res.redirect(req.url);
  });
};

/**
 * Show user profile.
 */

exports.profile = function(req, res, next) {
  const key = 'user:' + req.params.username;
  db.exists([key], function(err, exists) {
    if (err) {
      return next(err);
    }
    if (exists) {
      db.hgetall([key], function(err, user) {
        if (err) {
          return next(err);
        }
        const joindate = new Date(user.joindate);
        user.bestguesstime = (user.bestguesstime / 1000).toFixed(1);
        user.joindate = utils.britishFormat(joindate);
        if (user.guessed !== '0') {
          user.meanguesstime = user.totguesstime / user.guessed;
          user.meanguesstime = (user.meanguesstime / 1000).toFixed(1);
        }
        user.worstguesstime = (user.worstguesstime / 1000).toFixed(1);
        delete user.email;
        delete user.password;
        delete user.salt;
        delete user.totguesstime;
        res.locals.slogan = utils.randomSlogan();
        res.render('user', user);
      });
      return;
    }
    res.status(404).send(http.STATUS_CODES[404]);
  });
};

exports.generateToken = function  (req,res,next){

const fs      = require("fs");
const jwt     = require("jsonwebtoken");

const privateKey = fs.readFileSync("./public/key/AuthKey.p8").toString();
const teamId     = "THHZ2S42GU";
const keyId      = "D293QVP2Q2";

const jwtToken = jwt.sign({}, privateKey, {
  algorithm: "ES256",
  expiresIn: "180d",
  issuer: teamId,
  header: {
    alg: "ES256",
    kid: keyId
  }
});

console.log(jwtToken);
res.status(200).json({
  token:jwtToken
});
}
