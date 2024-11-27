import express from "express";
import { createServer } from "http";
import cors from "cors";
import {Server} from "socket.io";

const app = express();
const httpServer = createServer(app);
const corsOptions = {
    origin: "https://green-link-delta.vercel.app/",
    methods: ["GET", "POST"],
    allowedHeaders : ['Content-Type', 'Authorization'],
    credentials : true
};
app.use(cors(corsOptions));
const io = new Server(httpServer, {
    cors: corsOptions
});

interface User {
    id: string;
    socket:  string
}

interface Room {
    users : User[];
    buffer: Array<{type: string, data: any}>
}

let rooms: { [roomId: string]: Room } = {};

io.on('connection', function connection(ws){
    ws.on('error', console.error);

    ws.on("disconnect", () => {
        console.log("Socket Disconnected: ", ws.id);
    })
    
    // SENDER
    ws.on('sender', (message) => {
        const { roomId, userId } = message;
        let roomIdExists : boolean = isRoomExists(roomId);
        
        if(!roomIdExists){
            rooms[roomId] = { users: [] , buffer: []};
            rooms[roomId].users.push({ id: userId, socket: ws.id });
            console.log("Sender added to room:", roomId, userId);
        }
    });

    // RECEIVER
    ws.on('receiver', (message) => {
        const { roomId, userId } = message;
        rooms[roomId].users.push({ id: userId, socket: ws.id });
        console.log("Receiver added to room:", roomId, userId);
    });

    // RECEIVER ON READY
    ws.on("ready", (message) => {
      console.log("Receiver is ready, Sending buffer.");
      const bufferStored = rooms[message.roomId].buffer;

      bufferStored.forEach((item) => {
        console.log( "--sending data to receiver--", item.type, Object.keys(item));

        const room = rooms[message.roomId];
        if (!room) return;

        const receiver = room.users.find(user => user.id === message.userId);

        if(receiver){
            io.to(receiver.socket).emit(item.type, { data : item.data });
        }
      });

      // Clear the buffer data
      rooms[message.roomId].buffer = [];
    }); 

    // CREATE OFFER
    ws.on('createOffer', (message) => {
        console.log('create answer from sender');
        const { roomId, userId, sdp } = message;
        const room = rooms[roomId];
        if (!room) return;

        //Find the receiver's socket
        const receiver = room.users.find(user => user.id !== userId);

        if (receiver) {
            io.to(receiver.socket).emit("createOffer", { data : sdp });
        }
        else{
            console.log('Adding to buffer : createOffer');
            rooms[message.roomId].buffer.push({
                type: 'createOffer',
                data : message.sdp
            })
        }
    });

    // CREATE ANSWER
    ws.on("createAnswer", (message) => {
        const { roomId, userId, sdp } = message;
        const room = rooms[roomId];
        if(!room) return;
        
        const sender =  room.users.find(user => user.id !== userId);
        if(sender){
            io.to(sender.socket).emit('createAnswer', { data : sdp });

        }        
    });

    // ICE CANDIDATE
    ws.on("iceCandidate", (message) => {
        console.log('Ice candidate from : ', message.userId);
        const { roomId, candidate } = message;
        const room = rooms[roomId];
        if (!room) return;
        
        if(ws.id === room.users[0].socket){
            console.log('ice candidate from sender');
            const receiver = room?.users[1]?.socket;
            if(receiver){
                io.to(receiver).emit("iceCandidate", { data : candidate });
            }
            else{
                console.log("ice candidate buffer is being added");
                room.buffer.push({
                    type: 'iceCandidate',   
                    data: candidate
                });
            }
        }
        else if(ws.id === room.users[1].socket){
            const sender = room.users[0]?.socket;
            io.to(sender).emit("iceCandidate", { data : candidate });
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