import { Editor as GrapesEditor } from "@grapesjs/studio-sdk-plugins/dist/types.js";
import { createObserver } from "client/api/observers";
import { useLoadAsync } from "client/api/useLoadAsync";
import { FormInput } from "client/components/FormInput";
import IconButton from "client/components/IconButton";
import { ShowError } from "client/components/ShowError";
import { AiPilotChatEvents } from "common/api/aiPilot/aiPilotEvents";
import { deStructureError } from "common/custom-error/custom-error";
import {
  AiChatMessage,
  ChatMessage,
  UserChatMessage,
} from "common/models/aiPilot/ChatMessage";
import { useEffect, useMemo, useState } from "react";
import InputGroup from "react-bootstrap/InputGroup";
import Spinner from "react-bootstrap/Spinner";

interface AiChatProps {
  projectId: string;

  editor: GrapesEditor;
}

export default function AiChat({ projectId, editor }: AiChatProps) {
  const [selectedChat, setSelectedChat] = useState("test-test");

  const { isLoading, error, response } = useLoadAsync(async () => {
    // get the list of chats for the project

    return [];
  }, [projectId]);

  const list = response || [];

  // load the list of chats
  //

  return (
    <div className="border-top h-100 d-flex flex-column">
      <h6 className="p-2 m-0 mb-1 border-bottom">AI Chat</h6>

      <ShowError error={error} />
      {isLoading && <Spinner animation="border" />}

      {selectedChat ? (
        <OpenChat projectId={projectId} chatId={selectedChat} editor={editor} />
      ) : (
        <div>
          <small className="text-muted">Select a chat to start</small>
        </div>
      )}
    </div>
  );
}

function OpenChat({
  projectId,
  chatId,
  editor,
}: {
  projectId: string;
  chatId: string;
  editor: GrapesEditor;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [chatError, setChatError] = useState<Error | null>(null);

  const [messages, setMessages] = useState<(AiChatMessage | UserChatMessage)[]>(
    []
  );
  console.log({ messages });

  // setup a chat observer
  const observer = useMemo(() => {
    const result = createObserver<AiPilotChatEvents, "aiPilot:chat:open">(
      "aiPilot:chat:open",
      { projectId, chatId },
      (data) => {
        setIsLoading(false);

        console.log({ data });

        if (data.error) {
          setChatError(deStructureError(data.error));
        }
      },
      (result) => {
        console.log("Chat result:", result);

        if (result.chatId !== chatId) {
          // not for this chat
          return;
        }

        if ("message" in result && result.message) {
          // append a new message
          setMessages((prev) => [
            ...prev,
            ChatMessage.fromData(result.message),
          ]);
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

              return [
                ...prev.filter((m) => m.uuid !== messageId),
                message.clone(),
              ];
            } else {
              console.warn("Could not find message to append content to", {
                messageId,
                messages: prev.map((m) => m.uuid),
              });
            }
            return prev;
          });
        }
      },
      // register the server request handlers
      {}
    );

    return result;
  }, [projectId, chatId]);

  useEffect(() => {
    return () => {
      observer.unSubscribe();
    };
  }, [observer]);

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

      <div className="mb-2 flex-grow-1 overflow-auto">
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

          return (
            <div key={index} className="m-1 my-3">
              {(msg as AiChatMessage).contents.map((m, i: number) => {
                if (m.category === "tool_call") {
                  return (
                    <div className="p-2 text-muted" key={i}>
                      <strong>Tool Call:</strong> {m.content}
                    </div>
                  );
                }

                return <span key={i}>{m.content}</span>;
              })}
            </div>
          );
        })}
      </div>

      <div className="p-1">
        <InputGroup>
          <FormInput
            value=""
            placeholder="Message..."
            type="text"
            as="textarea"
            onRealChange={(value) => {
              console.log("Input changed:", value);
              observer.sendRequest("user-message", { message: value });
            }}
          />
          <IconButton icon="check" variant="outline-primary" />
        </InputGroup>
      </div>
    </div>
  );
}
