var express = require('express');
const config = require('../config');
const randomSlogan = require('../lib/utils').randomSlogan;
const privateclient = require('../lib/redis-clients').privateclient;
var router = express.Router();
/**
 * Private room Create
 */
router.get('/create',function(req,res){
    res.render('playlistSelection',{loggedin: req.session.user,
        user:req.session.user,
        rooms: config.rooms,
        slogan: randomSlogan()});
});
router.post('/create/playlist',function(req,res){
    res.render('createPrivate',{
        ...req.body,
        difficulty:req.body.difficulty ? req.body.difficulty:0,
        loggedin: req.session.user,
        user:req.session.user,
        rooms: config.rooms,
        room:Math.floor((Math.random() * 9999999) + 1),
        pincode:Math.floor((Math.random() * 9999) + 1),
        slogan: randomSlogan()});      
});
router.post('/create/room',function(req,res){
    let {room,pincode,difficulty,region,playlist,noOfPlayers,noOfSongs} = req.body;
    let values = difficulty+','+region+','+playlist+','+noOfPlayers+','+noOfSongs;
    console.log('create room',room, pincode,values);
    privateclient.set(room+'-'+pincode+'-confg',values,function(err,ok){
        console.log(err, ok);
        res.redirect('/privateRoom/room/?room='+room+'&pincode='+pincode);
    });
});
router.get('/join', function(req,res){
    res.render('joinPrivate',{loggedin: req.session.user,
        rooms: config.rooms,
        slogan: randomSlogan(),
        message:''
    });
});
router.post('/room',function(req,res){
    let {room,pincode} = req.body;
    privateclient.set(room+'-'+pincode+'-isstarted',1,function(err,data){
        res.redirect('/privateRoom/room/?room='+room+'&pincode='+pincode);
    });
});
router.get('/room',function(req,res){
    let {room,pincode} = req.query;
    console.log(req.session.user,'request room',room,pincode);
    privateclient.get(room+'-'+pincode+'-confg',function(err,data){
        console.log(err, data);
        if(!err && data){
            if(req.query.name){
                req.session.user = req.query.name;
            }
            if(!req.session.user){
                return res.render('privateWithoutLogin',{room:room,pincode:pincode,loggedin: req.session.user,
                    rooms: config.rooms,
                    room:room,
                    pincode:pincode,
                    slogan: randomSlogan()
                });
            }
            privateclient.get(room+'-'+pincode+'-isstarted',function(err,data){
                if(err || !data){
                    return res.render('waitingRoom',{room:room,pincode:pincode,loggedin: req.session.user,
                        rooms: config.rooms,
                        room:room,
                        pincode:pincode,
                        user:req.session.user,
                        slogan: randomSlogan()
                    });
                }
                data = data.split(',');
                let roomConfig = {room:room,pincode:pincode,
                    difficulty:data[0],
                    region:data[1],
                    playlist:data[2],
                    noOfPlayers:data[3],
                    noOfSongs:data[4]
                }; 
                res.render('privateRoom',{room:room,pincode:pincode,loggedin: req.session.user,
                    rooms: config.rooms,
                    rooms:roomConfig.playlist,
                    roomConfig:roomConfig,
                    user:req.session.user,
                    slogan: randomSlogan()
                });
            });
        }
        else{
            res.render('joinPrivate',{
                loggedin: req.session.user,
                rooms: config.rooms,
                slogan: randomSlogan(),
                message:'We are sorry either pin code or room number is not valid!'
            });
        }
    });
});
router.get('/chat/:room',function(req,res){
    let chat =[];
    console.log('req.params.room',req.params.room)
    privateclient.get(req.params.room, function(err, result) {
        console.log(err,result)
        if(!err && result){
            chat = result.split(',');
        }
        res.json({success:true,data:chat});
      });
})
module.exports = router;
