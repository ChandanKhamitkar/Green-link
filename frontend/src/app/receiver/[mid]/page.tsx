// Receiver page
'use client';
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

export default function Page() {

  const {mid} = useParams<{mid: string}>();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const SenderVideoRef = useRef<HTMLVideoElement | null>(null);
  const [localVideoTrack, setlocalVideoTrack] = useState<MediaStreamTrack | null>(null);
  const MyVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    setSocket(socket);

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'receiver',
        userId: 'user098',
        roomId: mid
      }));
      startReceivingData(socket);
    };

    return () => {
      // Clean up WebSocket connection
      socket.close();
    };
  }, []);

  const startReceivingData = async (socket: WebSocket) => {

    const pc = new RTCPeerConnection();
    setPc(pc);

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const videoTrack = stream.getVideoTracks()[0];
    setlocalVideoTrack(videoTrack);
    pc.addTrack(videoTrack, stream);
    if(MyVideoRef.current){
      MyVideoRef.current.srcObject = new MediaStream([videoTrack])
    }

    // video track
    pc.ontrack = (event) => {
      if (SenderVideoRef.current) {
        SenderVideoRef.current.srcObject = new MediaStream([event.track]);
        SenderVideoRef.current.play().catch((error) => {
          console.error('Video playback failed:', error);
        });
      }
    };

    pc.onicecandidate = event => {
      if (event.candidate) {
        socket.send(JSON.stringify({ 
          type: 'iceCandidate', 
          candidate: event.candidate,
          userId: 'user098',
          roomId: mid
        }));
      }
    };

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'createOffer') {
        pc.setRemoteDescription(message.sdp).then(() => {
          pc.createAnswer().then((answer) => {
            pc.setLocalDescription(answer);
            socket.send(JSON.stringify({
              type: 'createAnswer',
              sdp: answer,
              userId: 'user098',
              roomId: mid
            }))
          })
        })
      }
      else if (message.type === 'iceCandidate') {
        await pc.addIceCandidate(message.candidate);
      }
    };
  };

  const startSendingData = async () => {

    // If not connected to socket then just 'return'
    if (!socket) {
      alert('Socket Connection is a Pre-requisite!🔴')
      return;
    };

    if (pc) {
      pc.onicecandidate = ((event) => {
        if (event.candidate) {
          socket?.send(JSON.stringify({
            type: 'iceCandidate',
            candidate: event.candidate,
            userId: 'user098',
            roomId: mid
          }))
        }
      });
    }
  };

  useEffect(() => {
    if(MyVideoRef.current){
      MyVideoRef.current.play().catch((error) => {
        console.error('Video playback failed:', error);
      });
    }
  },[MyVideoRef]);


  return (
    <div className="text-white flex flex-col gap-5 justify-center items-center">
      <p className="text-center text-4xl font-bold">Receiver</p>
      {socket && (
        <button
          onClick={startSendingData}
          className="bg-yellow-500 rounded-md px-4 py-3 text-semibold text-black"
        >
          Join Now
        </button>
      )}

      <div className="flex flex-row-reverse gap-3 justify-center items-center w-full">
        {
          SenderVideoRef && (
            <div className="flex justify-center items-center flex-col w-[45%]">
              <video id="senderVideoLayout" autoPlay ref={SenderVideoRef} className="border border-blue-500 p-3 rounded-md w-full"></video>
              <p>Peer's Video</p>
            </div>
          )
        }

        {
          socket && MyVideoRef && (
            <div className="flex justify-center items-center flex-col w-[300px]">
              <video autoPlay ref={MyVideoRef} className="border border-gray-50 p-3 rounded-md w-full"></video>
              <p>My Video</p>
            </div>
          )
        }
      </div>
    </div>
  );
}
