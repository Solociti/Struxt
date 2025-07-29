import {
  ServerToClientEvents,
  SubscriptionCallback,
} from "common/api/websocket";
import { socket } from "./websocket";

/**
 * Creates a numeric ID for the observer.
 *
 * This only needs to be unique within the current session,
 * so we don't need to store it anywhere.
 */
let idCounter = 0;

export function createObserver<K extends keyof ServerToClientEvents>(
  event: K,
  query: { [key: string]: any } | null,
  subscription: SubscriptionCallback,
  callback: ServerToClientEvents[K]
): () => void {
  const listener = (...args: Parameters<ServerToClientEvents[K]>) => {
    (callback as any).apply(null, args);
  };

  const id = idCounter++;

  socket.on(event, listener as any);
  socket.emit("subscribe:init", event, id, query, (result) => {
    subscription(result);
  });

  return () => {
    socket.off(event, listener as any);
    socket.emit("subscribe:stop", event, id);
  };
}
