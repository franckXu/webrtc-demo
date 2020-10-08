const express = require("express");
const WebSocket = require("ws");
const http = require("http");
const uuidv4 = require("uuid").v4;

const app = express();
const port = process.env.PORT || "9000";
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const users = {};

const sendTo = (connection, message) => {
    connection.send(JSON.stringify(message));
}

const sendToAll = (clients, type, { id, name: userName }) => {
    Object.values(clients).map(client => {
        if (client.name !== userName) {
            client.send(JSON.stringify({
                type,
                user: { id, userName }
            }));
        }
    })
}

wss.on('connection', ws => {

    ws.on('message', msg => {
        let data;
        try {
            data = JSON.parse(msg);
        } catch (err) {
            console.error('invalid JSON', msg, err);
            data = {};
        }
        const { type, name, offer, answer, candidate } = data;
        switch (type) {
            case 'login': {
                // check if username availabel
                if (users[name]) {
                    sendTo(ws, {
                        type: 'login',
                        success: false,
                        mseeage: 'username is unavailabel'
                    })
                } else {
                    const id = uuidv4();
                    const loggedIn = Object.values(users)
                        .map(({ id, name: userName }) => ({ id, userName }));

                    users[name] = ws;
                    ws.name = name;
                    ws.id = id;
                    sendTo(ws, {
                        type: 'login',
                        success: true,
                        users: loggedIn
                    });
                    sendToAll(users, "updateUsers", {
                        id, name
                    });
                }
                break;
            }
            case 'offer': {
                // check if user to send offer to exists
                const offerRecipient = users[name];
                if (!!offerRecipient) {
                    sendTo(offerRecipient, {
                        type: "offer",
                        offer,
                        name: ws.name
                    });
                } else {
                    sendTo(ws, {
                        type: 'error',
                        message: `user ${name} not exists`
                    })
                };
                break;
            }
            case "answer": {
                // check if user to send answer to exists
                const answerRecipient = users[name];
                if (!!answerRecipient) {
                    sendTo(answerRecipient, {
                        type: "answer",
                        answer,
                        name,
                    })
                } else {
                    sendTo(ws, {
                        type: 'error',
                        message: `user ${name} not exists`
                    })
                }
                break;
            }
            case "candidate": {
                const candidateRecipient = users[name];
                if (!!candidateRecipient) {
                    sendTo(candidateRecipient, {
                        type: "candidate",
                        candidate
                    });
                } else {
                    sendTo(ws, {
                        type: 'error',
                        message: `User ${name} does not exist!`
                    })
                }
                break;
            }
            case "leave": {
                sendToAll(users, "leave", ws);
                break;
            }
            default: {
                sendTo(ws, {
                    type: 'error',
                    message: "command not found: " + type
                })
            }
        }
    });

    ws.on("close", function () {
        delete users[ws.name];
        sendToAll(users, "leave", ws);
    });

    ws.send(
        JSON.stringify({
            type: "message",
            message: "well hello there, I am  websocket server"
        })
    );
});

server.listen(port, () => {
    console.log(`signallign server running on port ${port}`);
});