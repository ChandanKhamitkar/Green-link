/* eslint-disable @typescript-eslint/no-explicit-any */
// Receiver page
'use client';
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import io from "socket.io-client";
import { iceConfiguration } from "@/lib/iceConfig";
import LeaveMeet from "@/components/buttons/LeaveMeet";

export default function Page() {

  const { mid } = useParams<{ mid: string }>();
  const [socket, setSocket] = useState<any>(null);
  const SenderVideoRef = useRef<HTMLVideoElement | null>(null);
  const MyVideoRef = useRef<HTMLVideoElement>(null);


  useEffect(() => {
    const newSocket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}`, {
      autoConnect: false,
      reconnection: true
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected");
      newSocket.emit("receiver", {
        userId: 'user098',
        roomId: mid
      });
      startReceivingData(newSocket);
    });

    newSocket.connect();
    return () => {
      newSocket.disconnect();
    };
  }, [mid]);

  const startReceivingData = async (socket: any) => {
    console.log('Start receving data is being called.');
    const pc = new RTCPeerConnection(iceConfiguration);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    const videoTrack = stream.getVideoTracks()[0];
    pc.addTrack(videoTrack, stream);
    if (MyVideoRef.current) {
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
        socket.emit("iceCandidate", {
          candidate: event.candidate,
          userId: 'user098',
          roomId: mid
        });
      }
    };

    // Notify the backend, that i am ready.
    socket.emit("ready", {
      userId: 'user098',
      roomId: mid
    });

    socket.on("createOffer", async (event: any) => {
      const { data } = event;
      pc.setRemoteDescription(data).then(() => {
        pc.createAnswer().then((answer) => {
          pc.setLocalDescription(answer);
          socket.emit("createAnswer", {
            sdp: answer,
            userId: 'user098',
            roomId: mid
          });
        })
      })
    });

    socket.on("iceCandidate", async (event: any) => {
      const { data } = event;
      await pc.addIceCandidate(data);
    });
  };

  useEffect(() => {
    if (MyVideoRef.current) {
      MyVideoRef.current.play().catch((error) => {
        console.error('Video playback failed:', error);
      });
    }
  }, [MyVideoRef]);

  const LeaveMeeting = async() => {
    await socket.disconnect();
  };

  return (
    <div className="h-screen text-white flex flex-col gap-5 justify-around items-center ">
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
      <div className="w-full flex justify-center items-center">
          <p className="w-fit mx-auto">
            <LeaveMeet fn={LeaveMeeting} />
          </p>
        </div>
    </div>
  );
}
