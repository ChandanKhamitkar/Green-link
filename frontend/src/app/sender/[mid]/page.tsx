// Sender page
'use client';
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

export default function Page() {
  
  const {mid} = useParams<{mid: string}>(); // Meet Id
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [localVideoTrack, setlocalVideoTrack] = useState<MediaStreamTrack | null>(null);
  const MyVideoRef = useRef<HTMLVideoElement>(null);
  const SenderVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    setSocket(socket);

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'sender',
        userId: 'user123',
        roomId: mid
      }));
      startSendingData(socket);
    };
    return () => {
      // Clean up WebSocket connection
      socket.close();
    };
  }, []);

  const startSendingData = async (socket: WebSocket) => {

    // If not connected to socket then just 'return'
    if(!socket) {
      alert('Socket Connection is a Pre-requisite!🔴')
      return;
    };

    // else Establish RTC connection
    const pc = new RTCPeerConnection();
    setPc(pc);
    pc.onicecandidate = ((event) => {
      if(event.candidate){
        socket?.send(JSON.stringify({
          type: 'iceCandidate',
          candidate: event.candidate,
          userId: 'user123',
          roomId: mid
        }))
      }
    })

    pc.onnegotiationneeded = async () => {
      // offer from sender that is ( me )
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.send(JSON.stringify({
        type: 'createOffer',
        sdp: pc.localDescription,
        userId: 'user123',
        roomId: mid
      }));
    }

    // answer from receiver
    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'createAnswer') {
        await pc.setRemoteDescription(message.sdp);
      }
      else if(message.type === 'iceCandidate'){
        await pc.addIceCandidate(message.candidate);
      }

    };

    gatherMedia(pc);

    // Get Other Side's video track.
    pc.ontrack = (event) => {
      if (SenderVideoRef.current) {
        SenderVideoRef.current.srcObject = new MediaStream([event.track]);
        SenderVideoRef.current.play().catch((error) => {
          console.error('Video playback failed:', error);
        });
      }
    }
  };

  const gatherMedia = async (pc: RTCPeerConnection) => {
    const stream = await window.navigator.mediaDevices.getUserMedia({
      video: true,
    })
    // MediaStream
    const videoTrack = stream.getVideoTracks()[0]
    setlocalVideoTrack(videoTrack);
    if (!MyVideoRef.current) {
      return;
    }
    stream.getTracks().forEach((track) => {
      pc?.addTrack(track);
    });
    MyVideoRef.current.srcObject = new MediaStream([videoTrack])
    MyVideoRef.current.play();
  };

  return(
    <div className="text-white flex flex-col gap-5 justify-center items-center">
      <h1 className="text-center text-4xl font-bold">Sender</h1>

      <div className="flex flex-row-reverse gap-3 justify-center items-center w-full">
        {
          socket && MyVideoRef && (
            <div className="flex justify-center items-center flex-col w-[300px]">
              <video autoPlay ref={MyVideoRef} className="border border-gray-50 p-3 rounded-md w-full"></video>
              <p>My Video</p>
            </div>
          )
        }

        {
          SenderVideoRef && (
            <div className="flex justify-center items-center flex-col w-[45%]">
              <video id="senderVideoLayout" autoPlay ref={SenderVideoRef} className="border border-blue-500 p-3 rounded-md w-full"></video>
              <p>Peer's Video</p>
            </div>
          )
        }
      </div>
    </div>
  );
}
