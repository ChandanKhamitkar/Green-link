// Receiver page
'use client';
import { useEffect, useRef, useState } from "react";

export default function Page() {
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showSender, setShowSender] = useState<boolean>(false);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'receiver'
      }));
    };
    
    startReceivingData(socket);
    return () => {
      // Clean up WebSocket connection
      socket.close();
    };
  }, []);

  const startReceivingData = async (socket: WebSocket) => {

    const pc = new RTCPeerConnection();

    // video track
    pc.ontrack = (event) => {
      console.log('Track func is logging!');
      if(videoRef.current){
        videoRef.current.srcObject = new MediaStream([event.track]);
        videoRef.current.play().catch((error) => {
          console.error('Video playback failed:', error);
        });
        setShowSender(true); 
      }
    }

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      if(message.type === 'createOffer'){
        pc.setRemoteDescription(message.sdp).then(() => {
          pc.createAnswer().then((answer) => {
            pc.setLocalDescription(answer);
            socket.send(JSON.stringify({
              type : 'createAnswer',
              sdp : answer
            }))
          })
        })
      }
      else if(message.type === 'iceCandidate'){
        await pc.addIceCandidate(message.candidate);
      }
   };
  };


  return (
    <div className="text-white flex justify-center items-center">
      <p>Receiver</p>
      <video autoPlay ref={videoRef}></video>
    </div>
  );
}
