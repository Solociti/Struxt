import { Editor as GrapesEditor } from "@grapesjs/studio-sdk-plugins/dist/types.js";
import { useLoadAsync } from "client/api/useLoadAsync";
import IconButton from "client/components/IconButton";
import { ShowError } from "client/components/ShowError";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import { formatDate } from "common/format/date";
import { useState } from "react";
import ListGroup from "react-bootstrap/ListGroup";
import Spinner from "react-bootstrap/Spinner";
import { createNewChat, loadChatList } from "./aiPilotChats";
import { OpenAiChat } from "./OpenAiChat";

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
        <OpenAiChat
          projectId={projectId}
          chatId={selectedChat}
          editor={editor}
        />
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
