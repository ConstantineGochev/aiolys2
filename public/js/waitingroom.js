(function() {
  'use strict'

  var waitingRoom = location.pathname.replace(/\/privateroom\/waiting\//g, '').split("/");
  var roomId = waitingRoom[0]
  var pin = waitingRoom[1]
  var currUser = $("#currUser").val()
  var primus;
  var $waitingUsers = $(".waitingUsers");
  var $startRoomBtn = $(".btnStartRoom");
  var $waitingRoomChatInput = $("#messageWaitingRoom")
  var $chat = $('#chat');
  var port;
  if (location.hostname === 'localhost') {
      port = ':8139/'
  } else {
      port = ':81/'
  }
  primus = new Primus({
    url: location.protocol + '//' + location.hostname + port + '?roomId=' + roomId + '&pin=' + pin,
    strategy: false
  });
  $startRoomBtn.on("click", function(e) {
    e.preventDefault();
    primus.send('trystartingroom', {roomId, pin, currUser})
  })
  var updateWaitingUsers = function(users) {
    console.log(users)
    $waitingUsers.empty();
    users.forEach(function(user) {

      var $joined = $(
        '<span class="join">' + user + ' is here</span> </br>'
      );
      $waitingUsers.append($joined)
    })
  }
  var updateChatMessages = function(msgs) {
    $chat.empty();
    msgs.forEach(function(data) {
      // $('<li>').text(data.message)
      var $msg = $(
        '<li>' + '<span>' + data.user + '</span>: ' + data.msg + '</li>'
      )
      $chat.append($msg)
    })
  }
  var removeUser = function(user) {
    $waitingUsers.children().remove(":contains(" + user + ")")
  }
  primus.on("open", function () {

    $waitingRoomChatInput.on('keydown', function(event) {
      if (event.keyCode === 13) {
        var value = $waitingRoomChatInput.val().trim();
        $waitingRoomChatInput.val('')
        if (value) {
          primus.send("waitingroommsg", {msg: value, user: currUser})
        }
      }
    })
    primus.send("updatewaitingusers")
    primus.on('data', function(data) {
      console.log(data)
      if (data.method === 'join') {
        updateWaitingUsers(data.users)
      }
      if (data.method === 'chat') {
        updateChatMessages(data.msgs)
      }
      if (data.method === 'start') {
        window.location.href = location.protocol + "//" + location.host + '/' + data.playlist
      }
      if (data.method === 'userleftwaitingroom') {
        removeUser(data.user)
      }
    })
    window.onbeforeunload = function(){
      primus.send("userisleavingwaitingroom", {user: currUser})
     };
  })


})()
