// Receiver page
'use client';
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

export default function Page() {

  const {mid} = useParams<{mid: string}>();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const SenderVideoRef = useRef<HTMLVideoElement | null>(null);
  const MyVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const socket = new WebSocket(`${process.env.NEXT_PUBLIC_BACKEND_URL}`);
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
  }, [mid]);

  const startReceivingData = async (socket: WebSocket) => {
    console.log('Start receving data is being called.');
    const pc = new RTCPeerConnection();
    console.log('RTC connection is being created. on Receiver side.');

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const videoTrack = stream.getVideoTracks()[0];
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

    // Notify the backend, that i am ready.
    socket.send(JSON.stringify({
      type: 'ready',
      userId: 'user098',
      roomId: mid
    }));

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'createOffer') {
        console.log('Create offer to receiver side');
        pc.setRemoteDescription(message.data).then(() => {
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
        console.log('Ice candidata to receiver side');
        await pc.addIceCandidate(message.data);
      }
    };
  };

  // const startSendingData = async () => {

  //   // If not connected to socket then just 'return'
  //   if (!socket) {
  //     alert('Socket Connection is a Pre-requisite!🔴')
  //     return;
  //   };

  //   if (pc) {
  //     pc.onicecandidate = ((event) => {
  //       if (event.candidate) {
  //         socket?.send(JSON.stringify({
  //           type: 'iceCandidate',
  //           candidate: event.candidate,
  //           userId: 'user098',
  //           roomId: mid
  //         }))
  //       }
  //     });
  //   }
  // };

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

      <div className="flex gap-3 justify-center items-center w-full">
        {
          SenderVideoRef && (
            <div className="flex justify-center items-center flex-col w-[45%]">
              <video id="senderVideoLayout" autoPlay ref={SenderVideoRef} className="border border-blue-500 p-3 rounded-md w-full"></video>
              <p>Peer Video</p>
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
