'use client';

import { LuLogOut } from "react-icons/lu";
import { useRouter } from "next/navigation";

export default function LeaveMeet(props : { fn: () => void }) {
    const router = useRouter();
    return (
        <p onClick={() => {
            props.fn();
            router.push("/");
        }} className="cursor-pointer px-4 py-3 rounded-full bg-red-500 text-white text-xl hover:bg-red-600 hover:transition-all hover:scale-110">
            <LuLogOut />
        </p>
    )
};
