const express = require("express");
const playListController = require('../controllers/playListController');

const router = express.Router({ mergeParams: "true" });

router
.route("/")
.get(playListController.getAll)
.post(playListController.createOne);

router
.route("/choosePlayList")
.get(playListController.getAllChose)
.post(playListController.createChoose);

router
    .route('/getUser')
    .get(playListController.getUser);

router
.route("/:id")
.patch(playListController.updateOne);



module.exports = router;