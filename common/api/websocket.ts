import { HTTPStatus } from "common/custom-error/custom-error";
import { AiPilotChatEvents } from "./aiPilot/aiPilotEvents";
import { NotificationsApi } from "./notifications/notifications";

/**
 * Events that the server can emit to the client
 */
export interface ServerToClientEvents {
  /**
   * Listen for updates to the notifications
   *
   * @param data
   * @returns
   */
  notifications: (data: NotificationsApi["GetResponse"]) => void;

  "aiPilot:chat:open": AiPilotChatEvents["open"];
}

/**
 * Keeps track of the query that is sent with the register event.
 */
export interface ServerEventsQuery
  extends Record<keyof ServerToClientEvents, any> {
  notifications: NotificationsApi["GetQuery"];
}

export type SubscriptionCallback = (
  result:
    | { success: true; error: null }
    | {
        success: false;
        error: { name: string; message: string; status: HTTPStatus };
      }
) => void;

/**
 * Events that the client can emit to the server
 */
export interface ClientToServerEvents {
  "subscribe:init": (
    event: keyof ServerToClientEvents,
    id: number,
    query: any,
    callback: SubscriptionCallback
  ) => void;
  "subscribe:stop": (event: keyof ServerToClientEvents, id: number) => void;
}

/**
 * Events that can be emitted between servers
 */
export interface InterServerEvents {}

/**
 * Data that can be stored in the `socket.data` object
 */
export interface SocketData {}
