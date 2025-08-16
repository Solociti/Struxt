import { ObserverSetup } from "common/api/observer";
import {
  ServerToClientEvents,
  SubscriptionCallback,
} from "common/api/websocket";
import {
  deStructureError,
  structureError,
} from "common/custom-error/custom-error";
import { socket } from "./websocket";

/**
 * Creates a numeric ID for the observer.
 *
 * This only needs to be unique within the current session,
 * so we don't need to store it anywhere.
 */
let idCounter = 0;

/**
 *
 * @param event The event name to listen for.
 * @param query Query parameters to send with the subscription.
 * @param subscription Subscription callback. Either a success or error response.
 * @param onMessage When the server emits a message on this event, this callback will be called.
 * @param onServerRequest When the server is requesting data from the client, this callback will be called.
 * @returns
 */
export function createObserver<
  Setup extends ObserverSetup,
  K extends keyof ServerToClientEvents
>(
  event: K,
  query: { [key: string]: any } | null,
  subscription: SubscriptionCallback,
  onMessage: ServerToClientEvents[K],
  onServerRequest?: Setup["serverRequests"]
) {
  const cleanup: Function[] = [];

  const listener = (...args: Parameters<ServerToClientEvents[K]>) => {
    (onMessage as any).apply(null, args);
  };

  const id = idCounter++;

  socket.on(event, listener as any);
  socket.emit("subscribe:init", event, id, query, (result) => {
    subscription(result);
  });

  if (onServerRequest) {
    for (const channel in onServerRequest) {
      const cb = async (request: any, callback: (...args: any[]) => void) => {
        try {
          const response = await onServerRequest[channel](request);
          callback(response);
        } catch (error: unknown) {
          callback({
            success: false,
            error: structureError(error as Error),
          });
        }
      };

      socket.on(`${event}:req:${channel}` as any, cb);

      cleanup.push(() => {
        socket.off(`${event}:req:${channel}` as any, cb);
      });
    }
  }

  return {
    /**
     * Send a request to the server.
     *
     * If the server doesn't handle the request, it will throw an error.
     *
     * @param args
     */
    sendRequest: <C extends keyof Setup["clientRequests"]>(
      channel: C,
      ...args: Parameters<Setup["clientRequests"][C]>
    ): Promise<ReturnType<Setup["clientRequests"][C]>> => {
      return new Promise((resolve, reject) => {
        socket.emit(
          `${event}:req:${String(channel)}` as any,
          ...args,
          (response: any) => {
            if (!response || response.error) {
              reject(
                deStructureError(response.error, "Unknown error from server")
              );
              return;
            }

            resolve(response);
          }
        );
      });
    },

    /**
     * Closes the observer and removes the listener.
     */
    unSubscribe: () => {
      socket.off(event, listener as any);
      socket.emit("subscribe:stop", event, id);

      cleanup.forEach((fn) => fn());
    },
  };
}
