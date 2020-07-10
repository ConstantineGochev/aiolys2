$(document).ready(function(){
    var room = $('#message').attr('data-room');
    var user = $('#message').attr('data-user') || 'Anonymous';
    console.log(room);
    var socket = io.connect('http://'+window.location.host);
    $.get('/privateRoom/chat/'+room,function(res){
        console.log(res);
        if(res.success){
            var chat = res.data;
            if(Array.isArray(chat)){
                chat.map(c => {
                    var li = $('<li>').text(c);
                    $('#chat').append(li);
                })
            }
        }
    })
    socket.emit('subscribe', room);

    socket.on('conversation private post', function(data) {
        //display data.message
        // console.log(data);
        var li = $('<li>').text(data.message);
        $('#chat').append(li);
    });
    $(document).on('click','.btnSend',function(e){
        sendMessage();
    });
    $(document).on('keypress','#message',function(e) {
        if(e.which == 13) {
            sendMessage();
        }
    });
    function sendMessage(){
        var message = $('#message').val();
        if(message){
            message = user+": "+message;
            socket.emit('send message', {
                room: room,
                message: message
            });
            var li = $('<li>').text(message);
            $('#chat').append(li);
            $('#message').val('');
        }
    }
});
