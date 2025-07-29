import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "common/api/websocket";
import { io, Socket } from "socket.io-client";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  location.origin,
  {
    path: "/api/socket",
  }
);

socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});
