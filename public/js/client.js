//our username 
var name;
var connectedUser;

//connecting to our signaling server
//var socket = io();
var socket = new WebSocket('ws://localhost:4000');

socket.onopen = function() {
    console.log("Connected to the signaling server");
};

//when we got a message from a signaling server 
socket.onmessage = function(message) {
    console.log("entering");
    console.log("Got message", message.data);


    var data = JSON.parse(message.data);
    console.log(data);

    switch (data.type) {
        case "login":
            handleLogin(data.success);
            break;
            //when somebody wants to call us 
        case "offer":
            handleOffer(data.offer, data.name);
            break;
        case "answer":
            handleAnswer(data.answer);
            break;
            //when a remote peer sends an ice candidate to us 
        case "candidate":
            handleCandidate(data.candidate);
            break;
        case "leave":
            handleLeave();
            break;
        default:
            break;
    }
};

socket.onerror = function(err) {
    console.log("Got error", err);
};

//alias for sending JSON encoded messages 
function send(message) {
    //attach the other peer username to our messages 
    if (connectedUser) {
        message.name = connectedUser;
    }

    socket.send(JSON.stringify(message));
};

//****** 
//UI selectors block 
//******

var loginPage = document.querySelector('#loginPage');
var usernameInput = document.querySelector('#usernameInput');
console.log("sas", usernameInput);
var loginBtn = document.querySelector('#loginBtn');


var callPage = document.querySelector('#callPage');
var callToUsernameInput = document.querySelector('#callToUsernameInput');
var callBtn = document.querySelector('#callBtn');

var hangUpBtn = document.querySelector('#hangUpBtn');

var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

var yourConn;
var stream;

callPage.style.display = "none";

// Login when the user clicks the button 
loginBtn.addEventListener("click", function(event) {
    console.log("inlogin");

    name = usernameInput.value;
    console.log(name);

    if (name.length > 0) {
        send({
            type: "login",
            name: name
        });
    }

});

function handleLogin(success) {
    console.log("inhabdlelogin");
    if (success === false) {
        alert("Ooops...try a different username");
    } else {
        loginPage.style.display = "none";
        callPage.style.display = "block";

        //********************** 
        //Starting a peer connection 
        //********************** 

        //getting local video stream 
        navigator.webkitGetUserMedia({ video: true, audio: true }, function(myStream) {
            stream = myStream;

            //displaying local video stream on the page 
            localVideo.srcObject = stream;
            localVideo.play();
            // console.log(localvideo.srcObject);

            //using Google public stun server 
            var configuration = {
                "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
            };
            console.log(configuration);
            yourConn = new webkitRTCPeerConnection(configuration);
            console.log(yourConn);

            // setup stream listening 
            const sdss = yourConn.addStream(stream);
            console.log(sdss);

            //when a remote user adds stream to the peer connection, we display it 
            yourConn.onaddstream = function(e) {
                console.log("CCC");
                remoteVideo.srcObject = e.stream;
                console.log(remoteVideo.src)
            };

            // Setup ice handling 
            yourConn.onicecandidate = function(event) {
                //console.log(event.candidate);
                if (event.candidate) {
                    send({
                        type: "candidate",
                        candidate: event.candidate
                    });
                }
            };

        }, function(error) {
            console.log(error);
        });

    }
};

//initiating a call 
callBtn.addEventListener("click", function() {
    console.log("incallbtn");
    var callToUsername = callToUsernameInput.value;

    if (callToUsername.length > 0) {

        connectedUser = callToUsername;

        // create an offer 
        yourConn.createOffer(function(offer) {
            console.log("CSS");
            send({
                type: "offer",
                offer: offer
            });

            yourConn.setLocalDescription(offer);
        }, function(error) {
            alert("Error when creating an offer");
        });

    }
});

//when somebody sends us an offer 
function handleOffer(offer, name) {
    console.log("inhandleoffer");
    connectedUser = name;
    yourConn.setRemoteDescription(new RTCSessionDescription(offer));

    //create an answer to an offer 
    yourConn.createAnswer(function(answer) {
        yourConn.setLocalDescription(answer);

        send({
            type: "answer",
            answer: answer
        });

    }, function(error) {
        alert("Error when creating an answer");
    });
};

//when we got an answer from a remote user
function handleAnswer(answer) {
    yourConn.setRemoteDescription(new RTCSessionDescription(answer));
};

//when we got an ice candidate from a remote user 
function handleCandidate(candidate) {
    yourConn.addIceCandidate(new RTCIceCandidate(candidate));
};

//hang up 
hangUpBtn.addEventListener("click", function() {

    send({
        type: "leave"
    });

    handleLeave();
});

function handleLeave() {
    connectedUser = null;
    remoteVideo.src = null;

    yourConn.close();
    yourConn.onicecandidate = null;
    yourConn.onaddstream = null;
};