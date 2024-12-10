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
        <div className="absolute top-0 left-0 w-full bg-[var(--main-color)] shadow-md py-3 px-8 flex justify-between items-center">
            <div className="flex justify-center items-center space-x-2">
                <img src="/logo.png" alt="Green link logo" className="size-8"/>
                <p className="md:text-2xl text-xl font-bold tracking-wide text-white">
                    GreenLink
                </p>
            </div>

            {/* Time */}
            {
                timeSpace !== '' && <p className="md:text-xl text-base mobile:block hidden font-semibold text-white/60 antialiased tracking-wider ">{timeSpace}</p>
            }
            
        </div>
    );
};
