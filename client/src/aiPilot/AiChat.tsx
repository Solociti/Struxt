import { Editor as GrapesEditor } from "@grapesjs/studio-sdk-plugins/dist/types.js";
import { createObserver } from "client/api/observers";
import { useLoadAsync } from "client/api/useLoadAsync";
import IconButton from "client/components/IconButton";
import { ShowError } from "client/components/ShowError";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import { AiPilotChatEvents } from "common/api/aiPilot/aiPilotEvents";
import { deStructureError } from "common/custom-error/custom-error";
import { formatDate } from "common/format/date";
import {
  AiChatMessage,
  ChatMessage,
  UserChatMessage,
} from "common/models/aiPilot/ChatMessage";
import { useEffect, useMemo, useState } from "react";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import ListGroup from "react-bootstrap/ListGroup";
import Spinner from "react-bootstrap/Spinner";
import ReactMarkdown from "react-markdown";
import { createNewChat, loadChatList } from "./aiPilotChats";
import { RenderAiMessage } from "./RenderAiMessage";

interface AiChatProps {
  projectId: string;

  editor: GrapesEditor;
}

export default function AiChat({ projectId, editor }: AiChatProps) {
  const [selectedChat, setSelectedChat] = useState("");

  // load the list of chats
  const { isLoading, error, response } = useLoadAsync(async () => {
    if (!projectId) {
      return null;
    }

    // get the list of chats for the project
    return await loadChatList(projectId);
  }, [projectId]);

  const list = response || [];

  // setup the method to create a new chat
  const newChatCb = useAsyncCallback(
    async () => {
      if (!projectId) {
        return;
      }

      const newChat = await createNewChat(projectId);
      setSelectedChat(newChat.uuid);

      return newChat;
    },
    {
      toastError: true,
    }
  );

  return (
    <div className="border-top h-100 d-flex flex-column">
      <h6 className="p-2 m-0 mb-1 border-bottom">AI Chat</h6>

      <ShowError error={error} />
      {isLoading && <Spinner animation="border" />}

      {selectedChat ? (
        <OpenChat projectId={projectId} chatId={selectedChat} editor={editor} />
      ) : (
        <div>
          <div className="d-flex justify-content-end p-2">
            <IconButton
              icon="add"
              variant="primary"
              size="sm"
              spinner={newChatCb.isLoading}
              onClick={newChatCb.callback}
            >
              New Chat
            </IconButton>
          </div>

          <hr className="my-1" />

          <small className="p-2 text-muted">Or select a chat to continue</small>

          <ListGroup className="p-2">
            {list.map((chat) => {
              return (
                <ListGroup.Item
                  key={chat.uuid}
                  action
                  onClick={() => setSelectedChat(chat.uuid)}
                >
                  <h5 className="mb-1">{formatDate(chat.created.date)}</h5>
                  <div className="d-flex justify-content-end">
                    <small className="text-muted">
                      {chat.created.displayName}
                    </small>
                  </div>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </div>
      )}
    </div>
  );
}

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
      {}
    );

    return result;
  }, [projectId, chatId]);

  useEffect(() => {
    return () => {
      observer.unSubscribe();
    };
  }, [observer]);

  // setup the message states
  const [inputValue, setInputValue] = useState("");

  const sendMessage = useAsyncCallback(
    async () => {
      if (!inputValue.trim()) {
        return;
      }

      await observer.sendRequest("user-message", {
        message: inputValue,
        context: {},
      });

      setInputValue("");
    },
    {
      toastError: true,
    }
  );

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
                sendMessage.callback();
              }
            }}
          />
          <IconButton icon="check" variant="outline-primary" />
        </InputGroup>
      </div>
    </div>
  );
}
