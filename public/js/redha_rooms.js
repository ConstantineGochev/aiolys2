let play = document.getElementById("choosePlayliste");


if (play){
    play.addEventListener("submit" , e => {

        
        e.preventDefault(); 
        let newEdit = document.getElementById("nameRoom").value ;

        let name = newEdit.split("+*PNL&+")[0], id = newEdit.split("+*PNL&+")[1];
        let username = play.getAttribute("data-user");

        var xhr = new XMLHttpRequest();

        let choose = { playlistName: name, playlistID: id, userName: username } ; 

        xhr.open("POST", `http://localhost:8138/api/playlist/choosePlayList?body=${JSON.stringify(choose)}`, true);

        xhr.send();
        
        // console.log(name , id );
        window.location.href = `/hits`;

        
    })
}