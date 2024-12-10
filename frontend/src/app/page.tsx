// This page shows 2 options, 1-Create Instant Meet | 2-Join Now
'use client';
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';
import { IoIosVideocam } from "react-icons/io";
import { MdArrowOutward } from "react-icons/md";
import Navbar from "@/components/Navbar";

export default function Home() {

  const router = useRouter();
  const roomID = uuidv4();

  return (
    <div className="bg-[var(--main-color)] text-white flex flex-col gap-5 justify-center items-center h-screen relative">
      <Navbar />
      {/* Create Instant Meet Button */}
      <div className="w-screen mobile:h-fit h-screen flex mobile:flex-row flex-col-reverse mobile:justify-between justify-center mobile:items-center items-start px-8 space-y-3 mobile:gap-0 gap-10">
        <div className="flex flex-col justify-between items-start space-y-3">
          <div className="flex flex-col justify-start space-y-2">
            <h2 className="mobile:text-3xl text-2xl font-bold">
              Peer-to-Peer Video Calling with WebRTC
            </h2>
            <p className="mobile:text-base text-sm">A basic demonstration of WebRTC's capabilities, showcasing simple two-way video chat functionality.</p>
          </div>
          <div className="flex mobile:flex-row flex-col justify-center mobile:items-center items-start mobile:space-x-4 space-x-0 mobile:space-y-0 space-y-4">
            <button onClick={() => router.push(`/sender/${roomID}/host`)} className="flex gap-3 justify-center items-center px-5 py-2 rounded-md bg-blue-500  font-semibold">
              <span className="mobile:size-4 size-3"><IoIosVideocam /></span>
              <span className="mobile:text-base text-sm">Create Instant Meet</span>
            </button>
            {/* Join Now Button */}
            <button disabled className="flex gap-3 justify-center items-center px-5 py-2 rounded-md bg-green-500 text-black font-semibold cursor-not-allowed">
              <span className="mobile:size-4 size-3"><MdArrowOutward /></span>
              <span className="mobile:text-base text-sm">Join Now</span>
            </button>
          </div>
        </div>

        <img src="/images/hero.jpg" alt="Hero" className="mobile:w-[30%] w-[50%] rounded-md" />
      </div>
    </div>
  );
}
