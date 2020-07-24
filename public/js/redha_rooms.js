var play = document.getElementById("choosePlayliste");
play.addEventListener("submit" , function(e) {

    e.preventDefault();
    let roomname = document.getElementById("nameRoom").value ;
    window.location.href = `/${roomname}`;


})
