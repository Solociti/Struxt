import { getApi, postApi } from "client/api/api";
import { AiPilotChatList, AiPilotNewChat } from "common/api/aiPilot/chatApi";

/**
 * Get the list of chats for a project
 *
 * @param projectId
 * @returns
 */
export async function loadChatList(projectId: string) {
  const query: AiPilotChatList["GetQuery"] = { projectId };

  const response: AiPilotChatList["GetResponse"] = await getApi(
    "/api/aiPilot/chat/list",
    query
  );
  return response.list;
}

/**
 * Create a new chat session for the project
 *
 * @param projectId
 * @returns
 */
export async function createNewChat(projectId: string) {
  const body: AiPilotNewChat["PostBody"] = { projectId };

  const response: AiPilotNewChat["PostResponse"] = await postApi(
    "/api/aiPilot/chat/new",
    body
  );

  return response;
}
