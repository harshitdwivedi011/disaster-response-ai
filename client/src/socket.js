import { io } from "socket.io-client";

const server_origin = import.meta.env.VITE_SERVER_ORIGIN;

export const socket = io(server_origin, {
  transports: ["websocket"], // helps with fallback issues
});
