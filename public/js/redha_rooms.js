var play = document.getElementById("choosePlayliste");
play.addEventListener("submit" , function(e) {

    e.preventDefault();
    let roomID = document.getElementById("nameRoom").value ;
    console.log(roomID)
    window.location.href = `/${roomID}`;


})
