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
import { TokenWallet } from "common/models/aiPilot/TokenWallet";
import { getTokenWallet } from "./tokens/tokenWallet";
import MaterialIcon from "client/components/MaterialIcon";
import Popover from "react-bootstrap/Popover";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import ProgressBar from "react-bootstrap/ProgressBar";

interface AiChatProps {
  projectId: string;

  editor: GrapesEditor;
}

export default function AiChat({ projectId, editor }: AiChatProps) {
  const [selectedChat, setSelectedChat] = useState("");

  // load the list of chats
  const { isLoading, error, response, reload } = useLoadAsync(async () => {
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

  const [wallet, setWallet] = useState<TokenWallet | null>(null);

  const { isLoading: walletIsLoading } = useLoadAsync(async () => {
    if (!projectId) {
      return null;
    }

    const w = await getTokenWallet(projectId);
    setWallet(w);

    return w;
  }, [projectId]);

  return (
    <div className="border-top h-100 d-flex flex-column">
      <div className="d-flex justify-content-between align-items-center p-1">
        <IconButton
          disabled={!selectedChat}
          icon="arrow_back"
          onClick={() => {
            reload();
            setSelectedChat("");
          }}
          size="sm"
          variant="outline-secondary"
        />

        <h6 className="m-0">AI Chat</h6>

        <OverlayTrigger
          overlay={
            <Popover>
              <Popover.Header as="h3">Token Wallet</Popover.Header>
              <Popover.Body style={{ minWidth: "15rem" }}>
                {wallet ? (
                  <div>
                    <h6>Monthly</h6>
                    <ProgressBar
                      max={wallet.monthlyAllowance}
                      now={wallet.monthlyUsage}
                    />
                    <div className="d-flex justify-content-between gap-2">
                      <span>
                        {Math.floor(wallet.monthlyUsage).toLocaleString()}
                      </span>
                      <span>
                        {Math.floor(wallet.monthlyAllowance).toLocaleString()}
                      </span>
                    </div>

                    {wallet.monthlyUsage > wallet.monthlyAllowance && (
                      <>
                        <h6 className="mt-2">Borrowed</h6>
                        <ProgressBar
                          max={wallet.emergencyLimit}
                          now={wallet.monthlyUsage - wallet.monthlyAllowance}
                          variant="warning"
                        />
                        <div className="d-flex justify-content-between gap-2">
                          <span>
                            {Math.floor(
                              wallet.monthlyUsage - wallet.monthlyAllowance
                            ).toLocaleString()}
                          </span>
                          <span>
                            {Math.floor(wallet.emergencyLimit).toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}

                    <hr />

                    <h6>Prepaid</h6>
                    <p>{wallet.prepaidBalance}</p>
                  </div>
                ) : walletIsLoading ? (
                  <p className="text-center">
                    <Spinner animation="border" />
                    <br />
                    Loading...
                  </p>
                ) : null}
              </Popover.Body>
            </Popover>
          }
          placement="bottom"
        >
          <MaterialIcon className="cursor-pointer">info</MaterialIcon>
        </OverlayTrigger>
      </div>

      <ShowError error={error} />
      {isLoading && <Spinner animation="border" />}

      {selectedChat ? (
        <OpenAiChat
          projectId={projectId}
          chatId={selectedChat}
          editor={editor}
          wallet={wallet}
          onWalletUpdate={(w) => setWallet(w)}
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
