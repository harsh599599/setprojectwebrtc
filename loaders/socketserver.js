module.exports = {
    initializeSocketServer
}
var WebSocketServer = require('ws').Server;

//creating a websocket server at port 9090 
var wss = new WebSocketServer({ port: 443 });

const socketIO = require('socket.io');

var io;
var users = {};

function initializeSocketServer(server) {
    io = socketIO(server, {
        transports: ['websocket', 'polling', 'xhr-polling', 'flashsocket'],
        pingInterval: 25000, // to send ping/pong events for specific interval (milliseconds)
        pingTimeout: 30000, // if ping is not received in the "pingInterval" seconds then milliseconds will be disconnected in "pingTimeout" milliseconds
    });

    wss.on("connection", (connection) => {
        console.log("client Connected : ", connection.id, new Date());

        connection.on('message', (message) => {
            console.log("messag", message);
            var data;
            //   data = JSON.parse(message);
            try {
                data = JSON.parse(message);



            } catch (e) {
                console.log("Invalid JSON");
                data = {};
            }
            switch (data.type) {
                //when a user tries to login
                case "login":
                    console.log("User logged", data.name);

                    //if anyone is logged in with this username then refuse 
                    if (users[data.name]) {
                        sendTo(connection, {
                            type: "login",
                            success: false
                        });
                    } else {
                        //save user connection on the server 
                        users[data.name] = connection;
                        connection.name = data.name;
                        console.log("coming");
                        sendTo(connection, {
                            type: "login",
                            success: true
                        });
                    }

                    break;
                case "offer":
                    //for ex. UserA wants to call UserB 
                    console.log("Sending offer to: ", data.name);

                    //if UserB exists then send him offer details 
                    var conn = users[data.name];

                    if (conn != null) {
                        //setting that UserA connected with UserB 
                        connection.otherName = data.name;

                        sendTo(conn, {
                            type: "offer",
                            offer: data.offer,
                            name: connection.name
                        });
                    }

                    break;
                case "answer":
                    console.log("Sending answer to: ", data.name);
                    //for ex. UserB answers UserA 
                    var conn = users[data.name];

                    if (conn != null) {
                        connection.otherName = data.name;
                        sendTo(conn, {
                            type: "answer",
                            answer: data.answer
                        });
                    }

                    break;

                case "candidate":
                    console.log("Sending candidate to:", data.name);
                    var conn = users[data.name];

                    if (conn != null) {
                        sendTo(conn, {
                            type: "candidate",
                            candidate: data.candidate
                        });
                    }

                    break;

                case "leave":
                    console.log("Disconnecting from", data.name);
                    var conn = users[data.name];
                    //conn.otherName = null;

                    //notify the other user so he can disconnect his peer connection 
                    if (conn != null) {
                        sendTo(conn, {
                            type: "leave"
                        });
                    }

                    break;
                default:
                    sendTo(client, {
                        type: "error",
                        message: "Command not found: " + data.type
                    });

                    break;

            }

        });
        connection.on("close", function() {

            if (connection.name) {
                delete users[connection.name];

                if (connection.otherName) {
                    console.log("Disconnecting from ", connection.otherName);
                    var conn = users[connection.otherName];
                    console.log(conn);
                    conn.otherName = null;

                    if (conn != null) {
                        sendTo(conn, {
                            type: "leave"
                        });
                    }
                }
            }

        });
        //  console.log("Got message from a user:", message);


        connection.send("Hello from server");
    });

    function sendTo(connection, message) {
        connection.send(JSON.stringify(message));
    }
}