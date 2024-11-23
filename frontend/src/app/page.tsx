// This page shows 2 options, 1-Create Instant Meet | 2-Join Now
'use client';
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';
import { IoIosVideocam } from "react-icons/io";
import { MdArrowOutward } from "react-icons/md";


export default function Home() {

  const router = useRouter();
  const roomID = uuidv4();

  return(
    <div className="bg-white text-white flex gap-5 justify-center items-center h-screen">
      {/* Create Instant Meet Button */}
      <button onClick={() => router.push(`/sender/${roomID}`)} className="flex gap-3 justify-center items-center px-5 py-2 rounded-md bg-blue-500  font-semibold">
        <span className="size-4"><IoIosVideocam /></span>
        <span className="text-base">Create Instant Meet</span>
      </button>
      {/* Join Now Button */}
      <button className="flex gap-3 justify-center items-center px-5 py-2 rounded-md bg-green-500 text-black font-semibold">
        <span className="size-4"><MdArrowOutward /></span>
        <span className="text-base">Join Now</span>
      </button>
    </div>
  );
}
