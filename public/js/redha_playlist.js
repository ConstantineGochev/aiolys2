const searchPlayList = document.getElementById("searchPlayList");
const createPlayList = document.getElementById("createPlayliste");
const newEdit = document.getElementById("newEdit");


let Alldata = JSON.parse(newEdit.getAttribute("data-list"));


let listAdded = [], listEditAdded = [] ;
let listDelete, listeDeleteP;

// Api search
if(searchPlayList){
    searchPlayList.addEventListener('keypress', async function(e) {

        if (e.key === 'Enter') {
            e.preventDefault();
            let value = searchPlayList.value;

            var request = new XMLHttpRequest();

            request.open('GET', `https://itunes.apple.com/search?term=${value}&limit=200`, true);

            request.onload = function () {

                var apiData = JSON.parse(this.response) ;
                document.getElementById("searchList").innerHTML = "";

                //display searchList

                apiData.results.forEach(function(elm) {

                    let track = elm.trackName, art = elm.artistName;
                    if (!track) {
                        track = "Undifined"
                    }
                    if (!art) {
                        track = "Undifined"
                    }


                        if (track.length > 16) {
                            track = track.slice(0, 13) + '...';
                        } if (track.length > 16 && art.length > 7) {
                            art = art.slice(0, 5) + "..";
                        } else if (art.length > 10) {
                            art = art.slice(0, 7) + "..";
                        }



                        document.getElementById("searchList")
                            .innerHTML += `<div class='parent'> <div class='ligne'> <img src='${elm.artworkUrl60}'> <div class='name'> ${track} </div>   <div class='art'> by ${art} </div> </div> <div class='add'> <p> add </p> </div> </div>`;



                });

                //add Data

                const addList = Array.from(document.getElementsByClassName("add"));

                addList.forEach((elm , l ) => {

                    elm.addEventListener('click', () => {
                    // verify exist data
                    let bool = true;

                    if (newEdit.value === "New") {

                        if (listAdded.includes(apiData.results[l])) {
                            bool = false;
                        }

                    } else {

                        let id = newEdit.value.split("+*PNL&+")[1];
                        let Mydata;

                        Alldata.forEach(elm => {
                            if (elm._id === id) {
                                Mydata = elm
                            }
                        })




                        Mydata.listAdded.forEach(elm => {
                            if (elm.trackId === apiData.results[l].trackId) {
                                bool = false;
                            }
                        })

                    }


                    if(bool){

                        // add Data
                        let elm = apiData.results[l];

                        if (newEdit.value === "New") {
                            listAdded.push(elm);
                        } else {
                            listEditAdded.listAdded.push(apiData.results[l]);
                        }



                        let track = elm.trackName, art = elm.artistName;

                        if (!track ) {
                        track = "Undifined"
                        }
                        if (!art ) {
                        track = "Undifined"
                        }

                            if (track.length > 16) {
                                track = track.slice(0, 13) + '...';
                            } if (track.length > 16 && art.length > 7) {
                                art = art.slice(0, 5) + "..";
                            } else if (art.length > 10) {
                                art = art.slice(0, 7) + "..";
                            }



                            document.getElementById("listAdded")
                                .innerHTML += `<div class='parent pdelete' data-id=${elm.trackId}> <div class='ligne'> <img src='${elm.artworkUrl60}'> <div class='name'> ${track} </div>   <div class='art'> by ${art} </div> </div> <div class='delete'> <p> Delete </p> </div> </div>`;



                        // delete data
                        listDelete = Array.from(document.getElementsByClassName("delete"));
                        listeDeleteP = Array.from(document.getElementsByClassName("pdelete"));


                        listDelete.forEach((elm, l) => {
                            elm.addEventListener('click', () => {

                                if (newEdit.value === "New") {

                                // listAdded.forEach(en => {
                                //     console.log(en.trackName);
                                // })

                                let list = listAdded;
                                listAdded = [];

                                list.forEach((e, k) => {

                                    if (e.trackId.toString() !== listeDeleteP[l].getAttribute("data-id") ) {
                                        listAdded.push(e);
                                    }
                                })



                                listDelete[l].className = "d-none";
                                listeDeleteP[l].className = "d-none";

                                // console.log("delete 1");
                                // listAdded.forEach(en => {
                                //     console.log(en.trackName);
                                // })

                                } else {
                                    let list = listEditAdded.listAdded;
                                    listEditAdded.listAdded = [];

                                    list.forEach((e, k) => {

                                        if (e.trackId.toString() !== listeDeleteP[l].getAttribute("data-id")) {
                                            listEditAdded.listAdded.push(e);
                                        }
                                    })



                                    listDelete[l].className = "d-none";
                                    listeDeleteP[l].className = "d-none";
                                }

                            })
                        });



                    }

                } )



            }); }

            request.send()

       }

    });
}



// create update playlist
if (createPlayList) {
    createPlayList.addEventListener("submit", function(e) {
        e.preventDefault();
        const name = document.getElementById("namePlayList").value;
        const username = document.getElementById("namePlayList").getAttribute("data-user");
        const type = "private";
        let check = true , tab=[] ;


        const body = { name, username, type };

        var xhr = new XMLHttpRequest();
        let lin = 0 ;

        if (newEdit.value === "New") {

            let fulllist = []

            listAdded.forEach(elm => {
                if (elm.trackId) {
                    fulllist.push(elm.trackId);
                }
            })

            const list = { fulllist };
            lin = fulllist.length ;
            xhr.open("POST", `http://35.184.102.237/api/playlist?body=${JSON.stringify(body)}&list=${JSON.stringify(list)}`, true);
        } else {
            check = false ;
            listEditAdded.name = name;
            let fulllist = listEditAdded.listAdded;
            tab = fulllist ;
            listEditAdded.listAdded = [];

            fulllist.forEach(elm => {
                if (elm.trackId) {

                    listEditAdded.listAdded.push(elm.trackId);
                } else {
                    listEditAdded.listAdded.push(elm);

                }
            })

            lin =  listEditAdded.listAdded.length;
            // console.log(listEditAdded.listAdded);

            xhr.open("PATCH", `http://35.184.102.237/api/playlist/${listEditAdded._id}?body=${JSON.stringify(listEditAdded)}`, true);
        }

        xhr.setRequestHeader("Content-Type", "application/json");
        // xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.onreadystatechange = function () {
            if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                window.location.href = `/`;
            }
        }


        console.log(lin);

        if(lin<15){
        document.getElementById("txt-pl").className="red-alert"
        document.getElementById("txt-nm").className="d-none"

        if(!check){
            listEditAdded.listAdded = tab;
        }

        } else if (!name) {
            document.getElementById("txt-pl").className = "d-none"
            document.getElementById("txt-nm").className = "red-alert"

            if (!check) {
                listEditAdded.listAdded = tab;
            }
        }
        else{

            xhr.send(JSON.stringify(body));
        }

    });
}


// edit play list
if (newEdit) {


    newEdit.addEventListener("change", () => {

        // display data
        let name = newEdit.value.split("+*PNL&+")[0], id = newEdit.value.split("+*PNL&+")[1];

        Alldata.forEach(elm => {
            if (elm._id === id) {
                listEditAdded  = elm ;
            }
        }) ;


        if (newEdit.value === "New") {
            document.getElementById("namePlayList").value = "";

            document.getElementById("listAdded").innerHTML = "";
            listAdded.forEach(elm => {

                if (Object.keys(elm).length !== 0) {

                    let track = elm.trackName, art = elm.artistName;


                    if (track.length > 16) {
                        track = track.slice(0, 13) + '...';
                    } if (track.length > 16 && art.length > 7) {
                        art = art.slice(0, 5) + "..";
                    } else if (art.length > 10) {
                        art = art.slice(0, 7) + "..";
                    }

                    document.getElementById("listAdded")
                        .innerHTML += `<div class='parent pdelete' data-id=${elm.trackId}> <div class='ligne'> <img src='${elm.artworkUrl60}'> <div class='name'> ${track} </div>   <div class='art'> by ${art} </div> </div> <div class='delete'> <p> Delete </p> </div> </div>`;

                }
            });


        } else {

            // // console.log(dataOne);
            document.getElementById("namePlayList").value = name;
            document.getElementById("listAdded").innerHTML = "";

            listEditAdded.listAdded.forEach(elm => {

                if (Object.keys(elm).length !== 0) {
                    let track = elm.trackName, art = elm.artistName;


                    if (track.length > 16) {
                        track = track.slice(0, 13) + '...';
                    } if (track.length > 16 && art.length > 7) {
                        art = art.slice(0, 5) + "..";
                    } else if (art.length > 10) {
                        art = art.slice(0, 7) + "..";
                    }


                    document.getElementById("listAdded")
                        .innerHTML += `<div class='parent pdelete' data-id=${elm.trackId}> <div class='ligne'> <img src='${elm.artworkUrl60}'> <div class='name'> ${track} </div>   <div class='art'> by ${art} </div> </div> <div class='delete'> <p> Delete </p> </div> </div>`;
                }


            });



        }

        // delete data
        listDelete = Array.from(document.getElementsByClassName("delete"));
        listeDeleteP = Array.from(document.getElementsByClassName("pdelete"));


        listDelete.forEach((elm, l) => {
            elm.addEventListener('click', () => {

                if (newEdit.value === "New") {

                    let list = listAdded;
                    listAdded = [];

                    list.forEach((e, k) => {

                        if (e.trackId.toString() !== listeDeleteP[l].getAttribute("data-id")) {
                            listAdded.push(e);
                        }
                    })



                    listDelete[l].className = "d-none";
                    listeDeleteP[l].className = "d-none";


                }else {

                    let list = listEditAdded.listAdded;
                    listEditAdded.listAdded = [];

                    list.forEach((e, k) => {

                        if (e.trackId.toString() !== listeDeleteP[l].getAttribute("data-id")) {
                            listEditAdded.listAdded.push(e);
                        }
                    })



                    listDelete[l].className = "d-none";
                    listeDeleteP[l].className = "d-none";


                }




            })
        });


    }); }
