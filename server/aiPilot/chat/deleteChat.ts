import { AiPilotChat } from "common/models/aiPilot/aiPilotChat";
import { getCollection, toArray } from "server/database/mongodb";
import { setupCheckPointer } from "../agents/agents";

/**
 * Permanently deletes a chat and its history
 *
 * @param chatId
 */
export async function permanentDeleteChat(chatId: string) {
  const checkPointer = await setupCheckPointer();
  const chatCollection = await getCollection<AiPilotChat>("ai_pilot_chats");

  await checkPointer.deleteThread(chatId);
  await chatCollection.deleteOne({ uuid: chatId });
}

/**
 * Permanently deletes all chats for a project
 *
 * @param projectId
 * @param log optional logging function
 */
export async function purgeProjectChats(
  projectId: string,
  log?: (msg: string) => void,
) {
  const collection = await getCollection<AiPilotChat>("ai_pilot_chats");

  const list = await toArray(collection.find({ projectId }));
  let count = 0;
  for (const chat of list) {
    await permanentDeleteChat(chat.uuid);
    count++;
  }

  log?.(`Deleted: ${count}:${list.length} chats`);
}
