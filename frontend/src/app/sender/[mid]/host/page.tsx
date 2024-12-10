/* eslint-disable @typescript-eslint/no-explicit-any */
// Sender page
'use client';
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { MdOutlineContentCopy } from "react-icons/md";
import io from "socket.io-client";
import toast from "react-hot-toast"
import { iceConfiguration } from "@/lib/iceConfig";
import LeaveMeet from "@/components/buttons/LeaveMeet";

export default function Page() {
  const { mid } = useParams<{ mid: string }>(); // Meet Id
  const [socket, setSocket] = useState<any>(null);
  const MyVideoRef = useRef<HTMLVideoElement>(null);
  const SenderVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const newSocket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}`, {
      autoConnect: false,
      reconnection: true
    });
    setSocket(newSocket);
    newSocket.on("connect", () => {
      console.log("Socket connected");
      newSocket.emit("sender", {
        userId: 'user123',
        roomId: mid
      });
      startSendingData(newSocket);
    });

    newSocket.connect();

    return () => {
      newSocket.emit("clearBuffer", { roomId: mid });
      // Clean up WebSocket connection
      newSocket.disconnect();
    };
  }, [mid]);

  const startSendingData = async (socket: any) => {

    // If not connected to socket then just 'return'
    if (!socket) {
      alert('Socket Connection is a Pre-requisite!🔴')
      return;
    };

    // else Establish RTC connection
    const pc = new RTCPeerConnection(iceConfiguration);

    pc.onnegotiationneeded = async () => {
      // offer from sender that is ( me )
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('create offer sent');
      socket.emit("createOffer", {
        sdp: pc.localDescription,
        userId: 'user123',
        roomId: mid
      });
    };

    pc.onicecandidate = ((event) => {
      if (event.candidate) {
        console.log('sending ice candidate');
        socket.emit("iceCandidate", {
          candidate: event.candidate,
          userId: 'user123',
          roomId: mid
        });
      }
    });

    // answer from receiver
    socket.on("createAnswer", async (event: any) => {
      console.log('Create answer received from peer');
      const { data } = event;
      await pc.setRemoteDescription(data);
    });
    socket.on("iceCandidate", async (event: any) => {
      console.log('Ice candidate received from peer');
      const { data } = event;
      await pc.addIceCandidate(data);
    });

    gatherMedia(pc);

    // Get Other Side's video track.
    pc.ontrack = (event) => {
      console.log('event = ', event);
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
      audio: true
    });
    // MediaStream
    const videoTrack = stream.getVideoTracks()[0]
    if (!MyVideoRef.current) {
      return;
    }
    stream.getTracks().forEach((track) => {
      console.log('Each of the track = ', track);
      pc?.addTrack(track);
    });
    MyVideoRef.current.srcObject = new MediaStream([videoTrack])
    MyVideoRef.current.play();
  };

  const LeaveMeeting = async() => {
    await socket.disconnect();
  };

  return (
    <div className="h-screen text-white flex flex-col gap-5 justify-around items-center">
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
      </div>
      <div className="w-full flex justify-center gap-10 items-center">
          <div className="flex justify-center items-center space-x-3 bg-white rounded-xl px-5 py-2 border border-slate-500">
            <p className="text-black/70 font-mono">{window.location.href.split('sender/')[0]}receiver/{mid}</p>

            <p onClick={() => {
              navigator.clipboard.writeText(`${window.location.href.split('sender/')[0]}receiver/${mid}`);
              toast.success("Link copied to clipboard.")
            }} className="cursor-pointer p-2 rounded-full flex justify-center items-center text-blue-600 hover:bg-slate-400">
              <MdOutlineContentCopy />
            </p>
          </div>
          <LeaveMeet fn={LeaveMeeting}/>
        </div>
    </div>
  );
}
