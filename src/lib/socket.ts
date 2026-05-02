import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL);
  }
  return socket;
};

export const connectSocket = (userId: string): Socket => {
  const s = getSocket();
  if (!s.connected) {
    s.auth = { userId };
    s.connect();
  }
  return s;
};

export const disconnectSocket = (): void => {
  if (socket?.connected) {
    socket.disconnect();
  }
};
