import { StructuredError } from "common/custom-error/custom-error";
import { ServerToClientEvents } from "./websocket";

export type RequestReturn<T> = Promise<
  (T & { success: boolean }) | { success: false; error: StructuredError }
>;

/**
 * Interface for setting up an observer.
 */
export interface ObserverSetup {
  event: keyof ServerToClientEvents;

  onMessage: ServerToClientEvents[keyof ServerToClientEvents];

  /**
   * Server requests to the client that can be handled by this observer.
   *
   * The key is the channel name, and the value is the function that handles the request.
   */
  serverRequests: {
    [key: string]: (request: any) => RequestReturn<any>;
  };

  /**
   * Client requests to the server that can be handled by this observer.
   *
   * The key is the channel name, and the value is the function that handles the request.
   */
  clientRequests: {
    [key: string]: (request: any) => RequestReturn<any>;
  };
}
