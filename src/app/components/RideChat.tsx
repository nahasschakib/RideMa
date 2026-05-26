"use client";
import axios from "axios";
import React from "react";

interface RideChatProps {
  currentRole: "user" | "driver" | "admin";
  bookingId: string;
  userName: string;
  driverName: string;
}

function RideChat({
  currentRole,
  bookingId,
  userName,
  driverName,
}: RideChatProps) {
  const otherName = currentRole == "user" ? driverName : userName;
  const myName = currentRole == "user" ? userName : driverName;

  const get = async()=>{
    try {
     const data = await axios.get("/api/chat/ai-suggestions")
     console.log(data)
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
    }
  }
  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-2xl overflow-hidden border border-zinc-100">
      <div className="flex bg-white py-3 px-4 shrink-0 items-center gap-3 border-b border-zinc-100">
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-xl bg-zinc-950 flex items-center justify-center text-xs font-bold text-white">
            {otherName.charAt(0).toUpperCase()}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-zinc-900 leading-none">{otherName}</p>
          <p className="text-[11px] text-emerald-500 font-semibold mt-0.5">En ligne</p>
        </div>
      </div>
      <button onClick={get}>click</button>
    </div>
  );
}

export default RideChat;
