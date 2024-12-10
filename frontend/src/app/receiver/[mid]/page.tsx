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
  const [meetStream, setMeetStream] = useState<MediaStream | null>(null);
  const SenderVideoRef = useRef<HTMLVideoElement | null>(null);
  const SenderAudioRef = useRef<HTMLAudioElement | null>(null);
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
      StopMeeting();
    };
  }, [mid]);

  const startReceivingData = async (socket: any) => {
    console.log('Start receving data is being called.');
    const pc = new RTCPeerConnection(iceConfiguration);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    setMeetStream(stream);

    stream.getTracks().forEach((track) => {
      pc?.addTrack(track);
    });
    if (MyVideoRef.current) {
      MyVideoRef.current.srcObject = stream;
    }

    // video track
    pc.ontrack = (event) => {
      if (SenderVideoRef.current && event.track.kind === 'video') {
        SenderVideoRef.current.srcObject = new MediaStream([event.track]);
        SenderVideoRef.current.play().catch((error) => {
          console.error('Video playback failed:', error);
        });
      }
      else if(SenderAudioRef.current && event.track.kind === 'audio'){
        SenderAudioRef.current.srcObject = new MediaStream([event.track]);
        SenderAudioRef.current.play().then(() => {
        }).catch((error) => {
          console.error('Audio Playback failed: ', error);
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
    StopMeeting();
  };
  
  const StopMeeting = async() => {
    if(meetStream){
      meetStream.getTracks().forEach((track) => track.stop());
      setMeetStream(null);
    }
  };


  return (
    <div className="bg-[var(--main-color)] h-screen text-white flex flex-col gap-5 justify-around items-center py-10">
      <p className="text-center text-4xl font-bold">Receiver</p>

      <div className="w-full h-full flex md:flex-row flex-col gap-3 justify-center items-center relative">
        {
          SenderVideoRef && (
            <div className="flex justify-center items-center flex-col w-[50%]">
              <video id="senderVideoLayout" autoPlay ref={SenderVideoRef} className="border border-blue-500 p-2 rounded-md w-full"></video>
              <audio id="senderAudioLayout" autoPlay ref={SenderAudioRef}></audio>
              <p>Peer Video</p>
            </div>
          )
        }

        {
          socket && MyVideoRef && (
            <div className="flex justify-center items-center flex-col mobile:w-[30%] w-[45%] absolute bottom-5 right-10">
              <video autoPlay ref={MyVideoRef} className="border border-gray-50 p-2 rounded-md w-full"></video>
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
