// Sender page
'use client';
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { MdOutlineContentCopy } from "react-icons/md";

export default function Page() {
  
  const {mid} = useParams<{mid: string}>(); // Meet Id
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const MyVideoRef = useRef<HTMLVideoElement>(null);
  const SenderVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const socket = new WebSocket(`${process.env.NEXT_PUBLIC_BACKEND_URL}`);
    // const socket = new WebSocket(`https://green-link-signaling-server.vercel.app/`);
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
  }, [mid]);

  const startSendingData = async (socket: WebSocket) => {

    // If not connected to socket then just 'return'
    if(!socket) {
      alert('Socket Connection is a Pre-requisite!🔴')
      return;
    };

    // else Establish RTC connection
    const pc = new RTCPeerConnection();
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
    <div className="h-screen text-white flex flex-col gap-5 justify-center items-center relative">
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
              <p>Peer Video</p>
            </div>
          )
        }

        <div className="flex justify-center items-center space-x-3 bg-white rounded-xl px-5 py-2 border border-slate-500 absolute bottom-10 left-7">
          <p className="text-black/70 font-mono">{window.location.href.split('sender/')[0]}/receiver/{mid}</p>

          <p onClick={() => {
            navigator.clipboard.writeText(`${window.location.href.split('sender/')[0]}/receiver/${mid}`);
            alert("Link copied to clipboard.")
          }} className="cursor-pointer p-2 rounded-full flex justify-center items-center text-blue-600 hover:bg-slate-400">
            <MdOutlineContentCopy />
          </p>
        </div>
      </div>
    </div>
  );
}
