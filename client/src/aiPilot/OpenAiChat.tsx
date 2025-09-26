import { Editor as GrapesEditor } from "@grapesjs/studio-sdk-plugins/dist/types.js";
import IconButton from "client/components/IconButton";
import { ShowError } from "client/components/ShowError";
import { roundNumber } from "common/format/number";
import { AiPilotModel } from "common/models/aiPilot/AiPilotModels";
import {
  AiChatMessage,
  UserChatMessage,
} from "common/models/aiPilot/ChatMessage";
import { useEffect, useRef, useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";
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

  const { chatError, isLoading, messages, sendMessage, models } =
    useAiChatState({
      projectId,
      chatId,
      editor,
    });

  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!container.current) {
      return;
    }
    const el = container.current;

    // scroll to bottom on first load
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      setTimeout(() => {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
      return;
    }

    // only scroll if already near the bottom
    const diff = el.scrollHeight - (el.scrollTop + el.clientHeight);
    if (diff > 100) {
      return;
    }

    isFirstLoad.current = false;

    el.scrollTo({
      top: el.scrollHeight,
    });
  }, [messages]);

  const tokens = messages.reduce((acc, msg) => {
    if (msg.isUserMessage) {
      return acc;
    }

    return (
      acc +
      (msg as AiChatMessage).contents.reduce((a, c) => a + c.totalTokens, 0)
    );
  }, 0);

  return (
    <div
      className="d-flex flex-column flex-grow-1 overflow-auto"
      style={{ maxHeight: "100%" }}
    >
      <div className="mb-2 px-2 d-flex justify-content-between border-bottom">
        <small className="text-muted">{chatId}</small>
        <small className="text-muted">{tokens}</small>
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

      <InputMessage
        isLoading={sendMessage.isLoading}
        sendMessage={sendMessage.callback}
        models={models.list}
        currentModel={models.current}
        selectModel={models.select}
      />
    </div>
  );
}

/**
 * Setup the message input text area
 *
 * @param param0
 * @returns
 */
function InputMessage({
  isLoading,
  sendMessage,
  models,
  currentModel,
  selectModel,
}: {
  isLoading: boolean;
  sendMessage: (msg: string) => Promise<any>;
  models: AiPilotModel[];
  currentModel: AiPilotModel | null;
  selectModel: (modelId: AiPilotModel) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [inputValue, setInputValue] = useState("");

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";

      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = parseInt(
        window.getComputedStyle(textareaRef.current).lineHeight || "20",
        10
      );

      const maxRows = 5;
      const maxHeight = lineHeight * maxRows;

      textareaRef.current.style.height =
        Math.min(scrollHeight, maxHeight) + "px";
    }
  }, [inputValue]);

  return (
    <div className="border rounded m-1">
      <Form.Control
        placeholder="Message..."
        disabled={isLoading}
        type="text"
        as="textarea"
        value={inputValue}
        className="border-0 shadow-none"
        style={{ resize: "none", overflow: "auto" }}
        ref={textareaRef}
        rows={1}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(inputValue).then(() => {
              setInputValue("");
            });
          }
        }}
      />

      {/* bottom toolbar */}
      <div className="d-flex justify-content-between m-1">
        <Dropdown
          onSelect={(key) => {
            const model = models.find((m) => m.id === key);
            if (model) {
              selectModel(model);
            }
          }}
        >
          <Dropdown.Toggle
            variant="outline-secondary"
            size="sm"
            className="text-truncate"
          >
            {currentModel ? currentModel.modelName : "Auto"}
          </Dropdown.Toggle>

          <Dropdown.Menu popperConfig={{ strategy: "fixed" }}>
            {models.map((model) => {
              return (
                <Dropdown.Item key={model.id} eventKey={model.id}>
                  <Dropdown.ItemText className="d-flex justify-content-between">
                    <div className="me-2">
                      {model.vendor} {model.modelName}
                    </div>
                    <small className="text-muted">
                      {roundNumber(model.tokenMultiplier, 2)}x
                    </small>
                  </Dropdown.ItemText>
                </Dropdown.Item>
              );
            })}
          </Dropdown.Menu>
        </Dropdown>

        <IconButton
          icon="send"
          variant="outline-primary"
          title="Send Message"
          size="sm"
          spinner={isLoading}
          onClick={() => {
            sendMessage(inputValue).then(() => {
              setInputValue("");
            });
          }}
        />
      </div>
    </div>
  );
}
