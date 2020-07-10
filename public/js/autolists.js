const createAuto = document.getElementById("addplaylistAuto");
var list = [] , body; 



if (createAuto) {
    createAuto.addEventListener("submit", e => {
        e.preventDefault();

        const name = document.getElementById("playlist_name").value ;
        const link = document.getElementById("playlist_url").value ;
        const type = "private";
        const username = document.getElementById("playlist_name").getAttribute("data-user");

        body = { name, username, type };

       

        var request = new XMLHttpRequest(); 

      
        request.open('GET', `https://api.music.apple.com/v1/catalog/us/playlists/${link}`, true);
   
        

        request.onload = function () {

            
            
            if (!JSON.parse(this.response).errors){

                document.getElementById("txt-gr").className ="green-alert"
                document.getElementById("txt-re").className = "d-none"
            
                var apiData = JSON.parse(this.response).data[0].relationships.tracks.data; 
                

                apiData.forEach(elm => {
                    list.push(elm.id);
                });

                var xhr = new XMLHttpRequest(); 

                xhr.open("POST", `http://localhost:8138/api/playlist?body=${JSON.stringify(body)}&list=${JSON.stringify(list)}`, true);

                xhr.setRequestHeader("Content-Type", "application/json");

                xhr.onreadystatechange = function () {
                    if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                        console.log("Added");
                        window.location.href = `/`;
                    }
                }



                xhr.send(JSON.stringify(body));


                
            }else {
                document.getElementById("txt-re").className = "red-alert"
                document.getElementById("txt-gr").className = "d-none"
            }
        }

        

        request.setRequestHeader("Authorization", "Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkQyOTNRVlAyUTIifQ.eyJpYXQiOjE1OTIyNDI0NjAsImV4cCI6MTYwNzc5NDQ2MCwiaXNzIjoiVEhIWjJTNDJHVSJ9.Fa970C8oAuvo-_qkeHukyIK4xkjie6oOMiGj5hzc8dxoUDc25k6VDVhzNsBoKoUWskokhtQk0z2F3MCJrp-sQQ");

        request.send()
        

        
    })
}









// if (createAuto) {
//     createAuto.addEventListener("submit", e => {
//         e.preventDefault();


//                 var xhr = new XMLHttpRequest();

//         let list = ["1440831862", "1440839158", "1440839549", "1440839205", "1440839534", "1388413850", "1388414162", "723390870", "724885384", "724885790"] ; 

//         let body = { name: "New Play Auto", username: "Red_User", type: "private" } ;





//                 xhr.open("POST", `http://localhost:8138/api/playlist?body=${JSON.stringify(body)}&list=${JSON.stringify(list)}`, true);

//                 xhr.setRequestHeader("Content-Type", "application/json");

//                 xhr.onreadystatechange = function () {
//                     if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
//                         bool = true ;
//                         window.location.href = `/`;
//                     }
//                 }



//                 xhr.send(JSON.stringify(body));


//     })}