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
}

export function useAiChatState({
  projectId,
  chatId,
  editor,
}: AiChatStateProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [chatError, setChatError] = useState<Error | null>(null);

  const [messages, setMessages] = useState<(AiChatMessage | UserChatMessage)[]>(
    []
  );

  const [modelsList, setModelsList] = useState<AiPilotModel[]>([]);
  const [currentModel, setCurrentModel] = useState<AiPilotModel | null>(null);

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
          setMessages((prev) =>
            updateMessages([...prev, ChatMessage.fromData(result.message)])
          );
        }

        if ("content" in result && result.content) {
          // append a new content chunk to the last AI message
          const messageId = result.messageId;

          setMessages((prev) => {
            const message = prev.find((m) => m.uuid === messageId) as
              | AiChatMessage
              | undefined;

            if (message) {
              // since we are cloning it yet, we don't need to validate the shape here
              message.contents.push(result.content);

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
    models: {
      list: modelsList,
      current: currentModel,
      select: (model: AiPilotModel) => {
        setCurrentModel(model);
      },
    },
  };
}
