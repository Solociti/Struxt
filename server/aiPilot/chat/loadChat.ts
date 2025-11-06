import { customError } from "common/custom-error/custom-error";
import {
  AiPilotChat,
  AiPilotChatListItem,
} from "common/models/aiPilot/aiPilotChat";
import { getCollection, toArray } from "server/database/mongodb";

/**
 * Get the chat from the database
 *
 * @param projectId
 * @param chatId
 * @returns
 */
export async function loadChat(projectId: string, chatId: string) {
  const collection = await getCollection<AiPilotChat>("ai_pilot_chats");

  const chat = await collection.findOne({
    projectId,
    uuid: chatId,
  });

  if (!chat) {
    throw customError(404, "Chat not found.");
  }

  return new AiPilotChat(chat);
}

/**
 * Gets the list of chats for the project
 *
 * @param projectId
 * @returns
 */
export async function loadChatList(
  projectId: string,
  offset: number,
  limit: number
) {
  const collection = await getCollection<AiPilotChatListItem>("ai_pilot_chats");

  const cursor = await collection.find(
    { projectId },
    {
      projection: { uuid: 1, projectId: 1, created: 1 },
      sort: { "created.date": -1 },
      limit: limit || 10,
      skip: offset || 0,
    }
  );

  const list = await toArray(cursor);

  // TODO: apply the user name to the created by field
  return list as AiPilotChatListItem[];
}
