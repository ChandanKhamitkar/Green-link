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
  const [meetStream, setMeetStream] = useState<MediaStream | null>(null);
  const SenderVideoRef = useRef<HTMLVideoElement | null>(null);
  const SenderAudioRef = useRef<HTMLAudioElement | null>(null);

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
      StopMeeting();
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
    }
  };

  const gatherMedia = async (pc: RTCPeerConnection) => {
    const stream = await window.navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    setMeetStream(stream);
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

  // Disconnect User from room
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
      <h1 className="text-center text-4xl font-bold">Sender</h1>

      <div className="w-full h-full flex md:flex-row-reverse flex-col-reverse gap-3 justify-center items-center relative">
        {
          socket && MyVideoRef && (
            <div className="flex justify-center items-center flex-col mobile:w-[30%] w-[45%] absolute bottom-5 right-10">
              <video autoPlay ref={MyVideoRef} className="border border-gray-50 p-2 rounded-md w-full"></video>
              <p>My Video</p>
            </div>
          )
        }

        {
          SenderVideoRef && (
            <div className="flex justify-center items-center flex-col w-[50%]">
             <video id="senderVideoLayout" autoPlay ref={SenderVideoRef} className="border border-blue-500 p-2 rounded-md w-full"></video>
             <audio id="senderAudioLayout" autoPlay ref={SenderAudioRef}></audio>
              <p>Peer Video</p>
            </div>
          )
        }
      </div>
      <div className="w-full flex justify-center gap-10 items-center">
          <div className="md:w-fit w-[50%] md:overflow-auto overflow-hidden flex justify-center items-center space-x-3 bg-white rounded-xl px-5 py-2 border border-slate-500">
            <p className="sm:text-base text-xs text-black/70 font-mono line-clamp-1 text-ellipsis ">{window.location.href.split('sender/')[0]}receiver/{mid}</p>

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
