import { ObserverSetup, RequestReturn } from "../observer";

export type AiPilotAgentIds = "supervisor" | "code_agent" | "chat_agent";

export interface AiPilotChatEvents extends ObserverSetup {
  event: "aiPilot:chat:open";

  serverRequests: {};

  clientRequests: {
    "user-message": (request: {
      message: string;
    }) => RequestReturn<{ success: boolean }>;
  };
}
