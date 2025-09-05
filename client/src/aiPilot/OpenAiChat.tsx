import { Editor as GrapesEditor } from "@grapesjs/studio-sdk-plugins/dist/types.js";
import IconButton from "client/components/IconButton";
import { ShowError } from "client/components/ShowError";
import {
  AiChatMessage,
  UserChatMessage,
} from "common/models/aiPilot/ChatMessage";
import { useEffect, useRef, useState } from "react";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Spinner from "react-bootstrap/Spinner";
import { RenderAiMessage } from "./RenderAiMessage";
import { useAiChatState } from "./useAiChatState";

/**
 * Render the open chat interface
 *
 * @param param0
 * @returns
 */
export function OpenAiChat({
  projectId,
  chatId,
  editor,
}: {
  projectId: string;
  chatId: string;
  editor: GrapesEditor;
}) {
  const container = useRef<HTMLDivElement>(null);

  const [inputValue, setInputValue] = useState("");

  const { chatError, isLoading, messages, sendMessage } = useAiChatState({
    projectId,
    chatId,
    editor,
  });

  useEffect(() => {
    if (!container.current) {
      return;
    }

    // only scroll if already near the bottom
    const diff =
      container.current.scrollHeight -
      (container.current.scrollTop + container.current.clientHeight);
    if (diff > 100) {
      return;
    }

    container.current.scrollTo({
      top: container.current.scrollHeight,
    });
  }, [messages]);

  return (
    <div
      className="d-flex flex-column flex-grow-1 overflow-auto"
      style={{ maxHeight: "100%" }}
    >
      <div className="mb-2 text-end px-2">
        <small className="text-muted">{chatId}</small>
      </div>

      {/* show the list of messages */}
      <ShowError error={chatError} />
      {isLoading && <Spinner />}

      <div ref={container} className="mb-2 flex-grow-1 overflow-auto">
        {messages.map((msg, index) => {
          if (msg.isUserMessage) {
            return (
              <div
                key={index}
                className="text-end my-3 ms-3 border rounded p-2"
                style={{ backgroundColor: "rgba(139, 92, 246, 0.2)" }}
              >
                {(msg as UserChatMessage).content}
              </div>
            );
          }

          return <RenderAiMessage key={index} message={msg as AiChatMessage} />;
        })}
      </div>

      <div className="p-1">
        <InputGroup>
          <Form.Control
            placeholder="Message..."
            disabled={sendMessage.isLoading}
            type="text"
            as="textarea"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage.callback(inputValue).then(() => {
                  setInputValue("");
                });
              }
            }}
          />
          <IconButton
            icon="check"
            variant="outline-primary"
            spinner={sendMessage.isLoading}
            onClick={() => {
              sendMessage.callback(inputValue).then(() => {
                setInputValue("");
              });
            }}
          />
        </InputGroup>
      </div>
    </div>
  );
}
