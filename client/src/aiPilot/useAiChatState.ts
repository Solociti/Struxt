import { Editor as GrapesEditor } from "@grapesjs/studio-sdk-plugins/dist/types.js";
import { createObserver } from "client/api/observers";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import { AiPilotChatEvents } from "common/api/aiPilot/aiPilotEvents";
import { deStructureError } from "common/custom-error/custom-error";
import { AiPilotModel } from "common/models/aiPilot/AiPilotModels";
import {
  AiChatMessage,
  ChatMessage,
  UserChatMessage,
} from "common/models/aiPilot/ChatMessage";
import { TokenWallet } from "common/models/aiPilot/TokenWallet";
import { useEffect, useMemo, useState } from "react";
import { getEditorContext } from "./tools/context";
import { setupClientTools } from "./tools/setupClientTools";

function updateMessages(
  msgs: (
    | AiChatMessage
    | UserChatMessage
    | Partial<AiChatMessage>
    | Partial<UserChatMessage>
  )[]
) {
  return msgs.map((m) => {
    if (m instanceof ChatMessage) {
      return m;
    }

    return ChatMessage.fromData(m);
  });
}

interface AiChatStateProps {
  projectId: string;
  chatId: string;
  editor: GrapesEditor;

  onWalletUpdate: (wallet: TokenWallet) => void;
}

export function useAiChatState({
  projectId,
  chatId,
  editor,
  onWalletUpdate,
}: AiChatStateProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [chatError, setChatError] = useState<Error | null>(null);

  const [messages, setMessages] = useState<(AiChatMessage | UserChatMessage)[]>(
    []
  );

  const [modelsList, setModelsList] = useState<AiPilotModel[]>([]);
  const [currentModel, setCurrentModel] = useState<AiPilotModel | null>(null);

  /**
   * Calculate token usage and availability
   */
  const tokensUsed = messages.reduce((acc, msg) => {
    if (msg.isUserMessage) {
      return acc;
    }

    return acc + (msg as AiChatMessage).tokens.consumed;
  }, 0);

  useEffect(() => {
    if (currentModel) {
      return;
    }

    // try to find the model from the last AI message that has a model set
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (!(msg instanceof AiChatMessage)) {
        continue;
      }

      if (msg.metadata.model) {
        const model = modelsList.find((m) => m.id === msg.metadata.model);
        if (model) {
          setCurrentModel(model);
          break;
        }
      }
    }
  }, [messages, modelsList]);

  // setup a chat observer
  const observer = useMemo(() => {
    const result = createObserver<AiPilotChatEvents, "aiPilot:chat:open">(
      "aiPilot:chat:open",
      { projectId, chatId },
      (data) => {
        setIsLoading(false);

        if (data.error) {
          setChatError(deStructureError(data.error));
        }
      },
      (result) => {
        if ("models" in result && result.models) {
          // initial models load
          const list = result.models
            .map((m) => new AiPilotModel(m))
            .sort((a, b) => {
              if (a.vendor === b.vendor) {
                return a.modelName.localeCompare(b.modelName);
              }

              return a.vendor.localeCompare(b.vendor);
            });

          setModelsList(list);
        }

        if ("wallet" in result && result.wallet) {
          // token wallet update
          onWalletUpdate(new TokenWallet(result.wallet));
        }

        if ("chatId" in result && result.chatId !== chatId) {
          // not for this chat
          return;
        }

        if ("chat" in result && result.chat) {
          // initial chat load
          setMessages(updateMessages(result.chat.messages));
        }

        if ("message" in result && result.message) {
          // append a new message
          setMessages((prev) => {
            // check if the message already exists
            const exitingIndex = prev.findIndex(
              (m) => m.uuid === result.message.uuid
            );

            if (exitingIndex !== -1) {
              const newList = [...prev];
              newList[exitingIndex] = ChatMessage.fromData(result.message);
              return updateMessages(newList);
            }

            return updateMessages([...prev, result.message]);
          });
        }

        if ("contents" in result && result.contents) {
          // append a new content chunk to the last AI message
          const messageId = result.messageId;

          setMessages((prev) => {
            const message = prev.find((m) => m.uuid === messageId) as
              | AiChatMessage
              | undefined;

            if (message) {
              // since we are cloning it yet, we don't need to validate the shape here
              const existingIds = message.contents.map((c) => c.uid);
              for (const content of result.contents) {
                const index = existingIds.indexOf(content.uid);

                if (index >= 0) {
                  message.contents[index] = content;
                  continue;
                }

                // append the new content
                message.contents.push(content);
                existingIds.push(content.uid);
              }

              return updateMessages([
                ...prev.filter((m) => m.uuid !== messageId),
                message.clone(),
              ]);
            } else {
              console.warn("Could not find message to append content to", {
                messageId,
                messages: prev.map((m) => m.uuid),
              });
            }

            return updateMessages(prev);
          });
        }
      },
      // register the server request handlers
      setupClientTools(editor)
    );

    return result;
  }, [projectId, chatId]);

  useEffect(() => {
    return () => {
      observer.unSubscribe();
    };
  }, [observer]);

  // setup the message states
  const sendMessage = useAsyncCallback(
    async (inputValue) => {
      if (!inputValue.trim()) {
        return;
      }

      const context = getEditorContext(editor);

      await observer.sendRequest("user-message", {
        message: inputValue,
        context,
        llmModel: currentModel ? currentModel.id : undefined,
      });
    },
    {
      toastError: true,
    }
  );

  return {
    isLoading,
    chatError,
    messages,
    sendMessage,
    tokens: {
      used: tokensUsed,
    },
    models: {
      list: modelsList,
      current: currentModel,
      select: (model: AiPilotModel) => {
        setCurrentModel(model);
      },
    },
  };
}
