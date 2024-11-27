'use client';
import { useEffect, useState } from "react";

export default function Navbar() {
    const [timeSpace, setTimSpace] = useState('');

    const daysOfWeek = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
    useEffect(() => {
        const date = new Date();
        setTimSpace(`${date.toLocaleTimeString()} . ${daysOfWeek[date.getDay()]} . ${date.getFullYear()} `)
    }, []);
    return(
        <div className="absolute top-0 left-0 w-full bg-neutral-100 shadow-md py-3 px-5 flex justify-between items-center">
            <div className="flex justify-center items-center space-x-2">
                <img src="/logo.png" alt="Green link logo" className="size-8"/>
                <p className="text-2xl font-bold tracking-wide text-black">
                    GreenLink
                </p>
            </div>

            {/* Time */}
            {
                timeSpace !== '' && <p className="text-xl font-semibold text-black/60 antialiased tracking-wider ">{timeSpace}</p>
            }
            
        </div>
    );
};
