const PlayList = require("../models/playlist");
const Choose = require("../models/choosePLModel");
const axios = require("axios");
const Room = require("../lib/rooms").room

exports.getAll = async (req , res ) => {
    try{

    console.log(req.query);
    let data = await PlayList.find(req.query) ;
    console.log(data)
    res.status(200).json({
        status: "success",
        results:data.length,
        data:{
            data
        }
    })

    } catch(err){

        res.status(404).json({
            status:"error"
        })
    }
}

exports.createOne = async (req , res)=> {

    var rooms = await require("../lib/rooms").rooms
    try{
        const body =JSON.parse(req.query.body);

        let list = req.query.list ;

        if (req.query.uo){
            req.query.uo.forEach(elm => {
                list += elm;
            });
        }


        // rooms.push(new Room(body.name, true))
        rooms[body.name.replace(/\s/g, "")] = new Room(body.name, true)
        let listAdded = JSON.parse(list), lastdata=[];
        if (listAdded.fulllist){

            for (let i = 0; i < listAdded.fulllist.length; i++) {
                music = await axios.get(`https://itunes.apple.com/lookup?id=${listAdded.fulllist[i].toString()}`);
                let obj = music.data.results[0];
                lastdata.push(obj);
            }
        } else {

            for (let i = 0; i < listAdded.length; i++) {
                music = await axios.get(`https://itunes.apple.com/lookup?id=${listAdded[i].toString()}`);
                let obj = music.data.results[0];
                lastdata.push(obj);
            }

        }

        body.listAdded = lastdata ;

        const data = await PlayList.create(body);
        res.status(200).json({
            status: "success",
            data: {
                data
            }
        });
    } catch(err){
        res.status(404).json({
            status: "error" ,
            err
        })
    }
}

exports.updateOne = async(req , res ) => {
    console.log(req.session.user)
    try{
        let data = req.query.body ;
        if (req.query.uo){

            req.query.uo.forEach(elm => {
                data += elm ;
            })
        }

      let body = JSON.parse(data);
      let lastdata = [] , music;

        for (let i = 0; i < body.listAdded.length ;i++){
            music = await axios.get(`https://itunes.apple.com/lookup?id=${body.listAdded[i].toString()}`);
            let obj = music.data.results[0];
            lastdata.push(obj);
        }


        const doc = await PlayList.findById(req.params.id);

        doc.name = body.name ;
        doc.listAdded = lastdata ;

        await doc.save();

        res.status(200).json({
            status: "success",
            data: {
                doc
            }
        });

    } catch(err){
        res.status(404).json({
            status: "error",
            err
        })
    }
}

let Myuser ;
exports.createChoose = async (req , res) => {
    try{

        let data = {};


        const body = JSON.parse(req.query.body) ;
        let search = {userName: body.userName} ;
        Myuser = body.userName;
        let exist = await Choose.find(search);

        if(exist.length > 0 ){

            const doc = await Choose.findById(exist[0]._id);
            // console.log("ex:", doc)

            doc.playlistName = body.playlistName;

            await doc.save();

        } else {
        data = await Choose.create(body);
        }

        res.status(200).json({
            status: "success" ,
            data : {
                data
            }
        });
    } catch(err){
        console.log(err);
    }
}

exports.getAllChose = async (req, res) => {
    try {

        let data = await Choose.find(req.query);

        res.status(200).json({
            status: "success",
            results: data.length,
            data: {
                data
            }
        })

    } catch (err) {

        res.status(404).json({
            status: "error"
        })
    }
}

exports.getUser = async (req , res ) => {
    try{

        let user =  req.session.user ;

        res.status(200).json({
            status: "success",
            user
        })

    } catch(err){
        console.log(err);
    }
}
