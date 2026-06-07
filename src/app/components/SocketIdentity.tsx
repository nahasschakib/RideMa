"use client";
import { useEffect } from "react";
import { getSocket } from "@/lib/socket";

export default function SocketIdentity({ userId }: { userId: string }) {
  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    socket.emit("identity", userId);
  }, [userId]);
  return null;
}
