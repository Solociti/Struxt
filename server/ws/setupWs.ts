import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "common/api/websocket";
import { Server } from "node:http";
import { Server as ioServer, Socket } from "socket.io";
import { onConnection } from "./observers";

export type SocketWithEvents = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

/**
 * Setup the WebSocket server
 *
 * @param server
 * @returns
 */
export async function setupWsServer(server: Server) {
  // setup the socket.io server
  const io = new ioServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(server, {
    path: "/api/socket",
  });

  io.on("connection", (socket) => {
    console.log("New WebSocket connection:", socket.id);

    onConnection(socket);

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected:", socket.id);
    });
  });

  return io;
}
