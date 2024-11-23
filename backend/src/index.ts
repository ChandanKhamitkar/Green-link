import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({port: 8080});

interface User {
    id: string;
    socket:  WebSocket | null
}

let rooms: { [roomId: string]: { users: User[] } } = {};

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
                        ]
                    }
                };
                console.log("Sender added to room successfully : RoomID: ", message.roomId, " UserId: ", message.userId);
            }
        }
        else if(message.type === 'receiver'){
            // adding User to Room
            rooms = {
                ...rooms,
                [message.roomId] : {
                    users: [
                        ...rooms[message.roomId].users,
                        {
                            id: message.userId,
                            socket: ws
                        }
                    ]
                }
            }
            console.log("Receiver added to room successfully : RoomID: ", message.roomId, " UserId: ", message.userId);
        }
        else if(message.type === 'createOffer'){
            if(ws !== rooms[message.roomId]?.users[0]?.socket) return; // (Sender)

            console.log("CreateOffer Received : RoomID: ", message.roomId, " UserId: ", message.userId);
            // (Receiver)
            rooms[message.roomId]?.users[1]?.socket?.send(JSON.stringify({
                type: 'createOffer',
                sdp: message.sdp
            }));
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
                rooms[message.roomId]?.users[1]?.socket?.send(JSON.stringify({ // (Receiver)
                    type: 'iceCandidate',
                    candidate: message.candidate
                }))
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

    // ws.send('hello there, the websocket is running!');
});

function isRoomExists ( roomId: string ) : boolean {
    return Object.keys(rooms).includes(roomId);
};