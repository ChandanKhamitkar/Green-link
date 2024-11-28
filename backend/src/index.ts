import express from "express";
import { createServer } from "http";
import cors from "cors";
import {Server} from "socket.io";

const app = express();
const httpServer = createServer(app);
const corsOptions = {
    origin: ["https://green-link-delta.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST", "OPTIONS", "PUT", "POST"],
    allowedHeaders : ['Content-Type', 'Authorization'],
    credentials : true
};
app.use(cors(corsOptions));
const io = new Server(httpServer, {
    cors: corsOptions
});

interface User {
    id: string;
    socketId:  string
}

interface Room {
    users : User[];
    buffer: Array<{type: string, data: any}>
}

let rooms: { [roomId: string]: Room } = {};

io.on('connection', function connection(socket){
    socket.on('error', console.error);

    socket.on("disconnect", () => {
        console.log("Socket Disconnected: ", socket.id);
    })
    
    // SENDER
    socket.on('sender', (message) => {
        const { roomId, userId } = message;
        let roomIdExists : boolean = isRoomExists(roomId);
        
        if(!roomIdExists){
            rooms[roomId] = { users: [] , buffer: []};
            rooms[roomId].users.push({ id: userId, socketId: socket.id });
            console.log("Sender added to room:", roomId, userId);
        }
    });

    // RECEIVER
    socket.on('receiver', (message) => {
        const { roomId, userId } = message;
        rooms[roomId].users.push({ id: userId, socketId: socket.id });
        console.log("Receiver added to room:", roomId, userId);
    });

    // RECEIVER ON READY
    socket.on("ready", (message) => {
      console.log("Receiver is ready, Sending buffer.");
      const bufferStored = rooms[message.roomId].buffer;

      bufferStored.forEach((item) => {
        console.log( "--sending data to receiver--", item.type, Object.keys(item));

        const room = rooms[message.roomId];
        if (!room) return;

        const receiver = room.users.find(user => user.id === message.userId);

        if(receiver){
            io.to(receiver.socketId).emit(item.type, { data : item.data });
        }
      });

      // Clear the buffer data
      rooms[message.roomId].buffer = [];
    }); 

    // CREATE OFFER
    socket.on('createOffer', (message) => {
        console.log('create answer from sender');
        const { roomId, userId, sdp } = message;
        const room = rooms[roomId];
        if (!room) return;

        //Find the receiver's socketId
        const receiver = room.users.find(user => user.id !== userId);

        if (receiver) {
            io.to(receiver.socketId).emit("createOffer", { data : sdp });
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
    socket.on("createAnswer", (message) => {
        const { roomId, userId, sdp } = message;
        const room = rooms[roomId];
        if(!room) return;
        
        const sender =  room.users.find(user => user.id !== userId);
        if(sender){
            io.to(sender.socketId).emit('createAnswer', { data : sdp });

        }        
    });

    // ICE CANDIDATE
    socket.on("iceCandidate", (message) => {
        console.log('Ice candidate from : ', message.userId);
        const { roomId, candidate } = message;
        const room = rooms[roomId];
        if (!room) return;
        
        if(socket.id === room.users[0].socketId){
            console.log('ice candidate from sender');
            const receiver = room?.users[1]?.socketId;
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
        else if(socket.id === room.users[1].socketId){
            const sender = room.users[0]?.socketId;
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