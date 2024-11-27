import express from "express";
import { createServer } from "http";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import e from "express";

const app = express();
const httpServer = createServer(app);
app.use(cors());
const wss = new WebSocketServer({ server: httpServer });

interface User {
    id: string;
    socket:  WebSocket | null
}

interface Room {
    users : User[];
    buffer: Array<{type: string, data: any}>
}

let rooms: { [roomId: string]: Room } = {};

wss.on('connection', function connection(ws){
    ws.on('error', console.error);

    ws.on('message', function message(data: any){
        console.log('Message function is getting logged');
        const message = JSON.parse(data);

        if(message.type === 'sender'){
 
            // Check wheather room already exists or not.
            let roomIdExists : boolean = isRoomExists(message.roomId);

            // Create Room
            if (!roomIdExists) {
                rooms = {
                    ...rooms,
                    [message.roomId]: { 
                        users: [
                            {
                                id: message.userId,
                                socket: ws
                            }
                        ],
                        buffer: []
                    }
                };
                console.log("Sender added to room successfully : RoomID: ", message.roomId, " UserId: ", message.userId);
            }
        }
        else if(message.type === 'receiver'){   
            // adding User to Room
            rooms[message.roomId] = {
                ...rooms[message.roomId],
                users: [
                    ...rooms[message.roomId].users,
                    {
                        id: message.userId,
                        socket: ws
                    }
                ]
            };
            console.log("Receiver added to room successfully : RoomID: ", message.roomId, " UserId: ", message.userId);

            // check wheather the Reciver is ready to accep the buffer data.
            ws.on('message', function (setupData: any){
                const setupMessage = JSON.parse(setupData);
                if(setupMessage.type === 'ready'){
                    console.log("Reciver is ready, Sending buffer.");
                    // Sending the buffer data.
                    const bufferStored = rooms[message.roomId].buffer;
                    bufferStored.forEach((item) => {
                        console.log('--sending data to receiver--', item.type, Object.keys(item));
                        ws.send(JSON.stringify(item));
                    });
                    // Clear the buffer data
                    rooms[message.roomId].buffer = [];
                }
            }); 


        }
        else if(message.type === 'createOffer'){
            if(ws !== rooms[message.roomId]?.users[0]?.socket) return; // (Sender)

            console.log("CreateOffer Received : RoomID: ", message.roomId, " UserId: ", message.userId);
            // (Receiver)
            const receiverSocket = rooms[message.roomId]?.users[1]?.socket;
            if(receiverSocket){
                receiverSocket?.send(JSON.stringify({
                    type: 'createOffer',
                    data: message.sdp
                }));
            }
            else{
                rooms[message.roomId].buffer.push({
                    type: 'createOffer',
                    data: message.sdp
                })
            }
        }
        else if(message.type === 'createAnswer'){
            if(ws !== rooms[message.roomId]?.users[1]?.socket) return; // (Receiver)

            console.log("Create Answer : RoomID: ", message.roomId, " UserId: ", message.userId);
            rooms[message.roomId]?.users[0]?.socket?.send(JSON.stringify({ // (Sender)
                type: 'createAnswer',
                sdp: message.sdp
            }));
        }
        else if(message.type === 'iceCandidate'){
            if(ws === rooms[message.roomId]?.users[0]?.socket){ // (Sender)
                console.log("IceCandidate from Sender: RoomID: ", message.roomId, " UserId: ", message.userId);

                const receiverSocket = rooms[message.roomId]?.users[1]?.socket;
                if(receiverSocket){
                    rooms[message.roomId]?.users[1]?.socket?.send(JSON.stringify({ // (Receiver)
                        type: 'iceCandidate',
                        data: message.candidate
                    }))
                }
                else{
                    rooms[message.roomId].buffer.push({
                        type: 'iceCandidate',
                        data: message.candidate
                    });
                }
            }
            else if(ws === rooms[message.roomId]?.users[1]?.socket){ // (Receiver)
                console.log("IceCandidate from Receiver: RoomID: ", message.roomId, " UserId: ", message.userId);
                rooms[message.roomId]?.users[0]?.socket?.send(JSON.stringify({ // (Sender)
                    type: 'iceCandidate',
                    candidate: message.candidate
                }))
            }
        }
    });
});

function isRoomExists ( roomId: string ) : boolean {
    return Object.keys(rooms).includes(roomId);
};

const port = process.env.PORT || 7878;
httpServer.listen(port, () => {
    console.log('Listening to the port : ', port);
});