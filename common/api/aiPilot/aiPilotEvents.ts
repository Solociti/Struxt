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
import { BasicComponentTree } from "./eventHelpers";

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

  serverRequests: {
    "list-pages": (request: {}) => RequestReturn<{
      success: boolean;
      pages: PageContext[];
    }>;

    "get-page-html": (request: {
      page: string;
    }) => RequestReturn<{ success: boolean; html: string; page: PageContext }>;

    "list-styles-selectors": () => RequestReturn<{
      success: boolean;
      selectors: string[];
    }>;

    "get-style-by-selector": (request: {
      selector: string;
    }) => RequestReturn<{ success: boolean; styles: string[] }>;

    "get-elements": (request: {
      page: string;
      selector?: string;
    }) => RequestReturn<{ success: boolean; elements: string[] }>;

    "get-available-blocks": (request: {}) => RequestReturn<{
      success: boolean;
      blocks: {
        id: string;
        label?: string;
        content?: BasicComponentTree;
      }[];
    }>;

    "get-traits": (request: { componentId?: string }) => RequestReturn<{
      success: boolean;
      traits: {
        name: string;
        type: string;
        value?: any;
        options?: any[];
      }[];
    }>;

    "get-layers": (request: { page?: string }) => RequestReturn<{
      success: boolean;
      layers: any[];
    }>;
  };

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
