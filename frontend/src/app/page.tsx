// Sender page
'use client';
import { useEffect, useRef, useState } from "react";

export default function Home() {

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [localVideoTrack, setlocalVideoTrack] = useState<MediaStreamTrack | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    setSocket(socket);

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'sender'
      }));
    };

    return () => {
      // Clean up WebSocket connection
      socket.close();
    };
  }, []);

  const startSendingData = async () => {

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
          candidate: event.candidate
        }))
      }
    })

    pc.onnegotiationneeded = async () => {
      // offer from sender that is ( me )
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.send(JSON.stringify({
        type: 'createOffer',
        sdp: pc.localDescription
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
  };

  const gatherMedia = async (pc: RTCPeerConnection) => {
    const stream = await window.navigator.mediaDevices.getUserMedia({
      video: true,
    })
    // MediaStream
    const videoTrack = stream.getVideoTracks()[0]
    setlocalVideoTrack(videoTrack);
    if (!videoRef.current) {
      return;
    }
    stream.getTracks().forEach((track) => {
      pc?.addTrack(track);
    });
    videoRef.current.srcObject = new MediaStream([videoTrack])
    videoRef.current.play();
  };

  return(
    <div className="text-white flex justify-center items-center">
      <h1>Sender</h1>
      {socket && (
        <button
          onClick={startSendingData}
          className="bg-blue-500 rounded-md px-4 py-3 text-semibold"
        >
          Send Data
        </button>
      )}

      {
        socket && videoRef && (
          <video autoPlay ref={videoRef}></video>
        )
      }
    </div>
  );
}
