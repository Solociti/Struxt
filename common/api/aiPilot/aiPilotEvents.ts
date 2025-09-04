import { AiPilotChat } from "common/models/aiPilot/aiPilotChat";
import {
  AiChatContents,
  AiChatMessage,
  UserChatMessage,
} from "common/models/aiPilot/ChatMessage";
import {
  AiMessageContext,
  PageContext,
} from "common/models/aiPilot/tools/Context";
import { ObserverSetup, RequestReturn } from "../observer";

export type AiPilotAgentIds = "supervisor" | "code_agent" | "chat_agent";

export interface AiPilotChatEvents extends ObserverSetup {
  event: "aiPilot:chat:open";

  open: (
    data:
      | { chatId: string; chat: AiPilotChat }
      | { chatId: string; messageId: string; message: UserChatMessage }
      | { chatId: string; messageId: string; message: AiChatMessage }
      | {
          chatId: string;
          messageId: string;
          content: AiChatContents;
          chunks: any[];
        }
  ) => void;

  serverRequests: {};

  clientRequests: {
    "user-message": (request: {
      message: string;

      context: AiMessageContext;

      /**
       * The temperature to use for th LLM
       */
      temperature?: number;
      /**
       * The LLM model to use.
       *
       * This is prefixed by the provider, e.g., "openai:gpt-4o", "anthropic:claude-3-5-sonnet-20240620"
       */
      llmModel?: string;
    }) => RequestReturn<{ success: boolean }>;
  };
}
