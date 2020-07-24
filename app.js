'use strict';

const banHandler = require('./lib/middleware/ban-handler');
const errorHandler = require('./lib/middleware/error-handler');
const express = require('express');
const favicon = require('serve-favicon');
const http = require('http');
const port = require('./config').port;
const port2 = require('./config').port2;
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const secret = process.env.SITE_SECRET || 'shhhh, very secret';
const cookieParser = require('cookie-parser')(secret);
const site = require('./routes/site');
const urlencoded = require('body-parser').urlencoded;
const user = require('./routes/user');
const room = require('./routes/room')
const usersdb = require('./lib/redis-clients').users;
const privateclient = require('./lib/redis-clients').privateclient;
const mongoose = require("mongoose");
const playListRouter = require("./routers/playListRouter");
const cors = require("cors")
/**
 * Setting up Express.
 */

const app = express();
const production = process.env.NODE_ENV === 'production';
const pub = __dirname + '/public'; // Path to public directory
const sessionstore = new RedisStore({ client: usersdb });
const server = http.createServer(app); // HTTP server object
const waitingRoomServer = http.createServer(app)
/**
 * Setting up the rooms.
 */

require('./lib/rooms')({
  parser: cookieParser,
  server: server,
  waitingRoomServer: waitingRoomServer,
  sessionstore: sessionstore
});
// Configuration
app.set('view engine', 'pug');
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "35.184.102.237"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
//app.use(express.static(__dirname + '/public'));
app.use('/static', express.static(pub, { maxAge: 2419200000 })); // 4 weeks = 2419200000 ms
app.use(favicon(pub + '/img/favicon.ico', { maxAge: 2419200000 }));
app.use(banHandler);
app.use(urlencoded({ extended: false }));
app.use(cookieParser);
app.use(
  session({
    cookie: {
      secure: production,
      maxAge: 14400000 // 4 h = 14400000 ms
    },
    proxy: production,
    resave: false,
    rolling: true,
    saveUninitialized: true,
    secret: secret,
    store: sessionstore
  })
);

// Routes
app.get('/token',user.generateToken);
app.use('/api/playlist', playListRouter);
app.get('/', site.home);
app.get("/privateroom/playlist", room.choosePlaylist)
app.post("/privateroom/roomparams", /*user.checkUser,*/room.postRoomParams)
app.get("/privateroom/waiting/:room/:pincode", room.waitingRoom)
app.get("/privateroom/join", room.joinPrivateroom)
app.post("/privateroom/join", room.joinPrivateroomPost)
app.get("/privateroom/room", room.privateRoom)

app.get('/artworks', site.artworks);
app.get('/changepasswd', site.validationErrors, site.changePasswd);
app.post(
  '/changepasswd',
  user.validateChangePasswd,
  user.checkOldPasswd,
  user.changePasswd
);
app.get('/leaderboards', user.leaderboards);
app.get('/createPlayList'/*,user.checkUser*/, user.createPlayList);
app.get('/chosePlayList', user.choosePlayList);

app.get('/playlist', user.playlist);


app.post('/playlist2',user.insertPlaylist);
app.get('/login', site.validationErrors, site.login);
app.post('/login', user.validateLogin, user.checkUser, user.authenticate);
app.get('/logout', user.logout);
app.get('/recoverpasswd', site.validationErrors, site.recoverPasswd);
app.post('/recoverpasswd', user.validateRecoverPasswd, user.sendEmail);
app.get('/resetpasswd', site.validationErrors, site.resetPasswd);
app.post('/resetpasswd', user.resetPasswd);
app.get('/sliceleaderboard', user.sliceLeaderboard);
app.get('/signup', site.validationErrors, site.signup);
app.post(
  '/signup',
  user.validateSignUp,
  user.userExists,
  user.emailExists,
  user.createAccount
);
app.post('/insertplaylist',user.insertPlaylist);
app.get('/:room', site.room);
app.get('/user/:username', user.profile);


app.use(errorHandler);


// Connect MongoDB
mongoose
  .connect("mongodb+srv://Admin:B2muUhCFT7tArmr@cluster0-ul3gt.gcp.mongodb.net/rap?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("mongoDB connection successful");
  });

// Begin accepting connections
server.listen(port, function() {
  console.info('aiolys server listening on port ' + port);
});
waitingRoomServer.listen(port2, function() {
  console.info("aiolys waiting room server listening on port " + port2)
})
//Private rooms implementation
// const io = require("socket.io")(server);
//Listen for a client connection
// io.on("connection", (socket) => {
//     console.log("New Client is Connected!");
//     socket.emit("welcome", "Hello and Welcome to the Server");
//     socket.on('subscribe', function(room) {
//       console.log('joining room', room);
//       socket.join(room);
//   });
//
//   socket.on('send message', function(data) {
//       console.log('sending room post', data.room);
//       privateclient.get(data.room, function(err, res) {
//         if(!err && res){
//             res = res+','+data.message;
//           try{
//             let ar = res.split(',');
//             if(ar.length > 500){
//               res = data.message;
//             }
//           }catch(ex){
//
//           }
//           // console.log('seetings...',data.room,res)
//           privateclient.set(data.room, res, function(err, res) {
//             // console.log('************',err,res);
//           });
//         }
//         else{
//           privateclient.set(data.room, data.message, function(err, res) {
//             // console.log('************',err,res);
//           });
//         }
//       });
//       socket.broadcast.to(data.room).emit('conversation private post', {
//           message: data.message
//       });
//   });
// });
