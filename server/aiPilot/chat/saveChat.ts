import { customError } from "common/custom-error/custom-error";
import { AiPilotChat } from "common/models/aiPilot/aiPilotChat";
import { getCollection } from "server/database/mongodb";
import { createSimpleId } from "server/utils/createId";

/**
 * Save the chat document to the database
 *
 * @param chat
 * @returns
 */
export async function saveChat(
  chat: AiPilotChat
): Promise<{ success: boolean; uuid: string }> {
  const collection = await getCollection<AiPilotChat>("ai_pilot_chats");

  // create a new UUID if this is a new chat
  if (chat.uuid === "new") {
    chat.uuid = await createSimpleId("ai_pilot_chat");
  }

  if (!chat.uuid) {
    throw customError(400, "Chat must have a valid UUID");
  }

  const result = await collection.updateOne(
    { uuid: chat.uuid },
    { $set: chat },
    { upsert: true }
  );

  return { success: result.acknowledged, uuid: chat.uuid };
}

/**
 * Append a message to the chat
 *
 * @param chatId
 * @param message
 */
export async function appendChatMessage(
  chatId: string,
  message: AiPilotChat["messages"][0]
) {
  const collection = await getCollection<AiPilotChat>("ai_pilot_chats");

  const result = await collection.updateOne(
    { uuid: chatId },
    { $push: { messages: message } }
  );

  if (result.matchedCount === 0) {
    throw customError(404, "Chat not found");
  }

  return { success: true };
}

/**
 * Update a specific message in the chat
 *
 * @param chatId
 * @param messageId
 * @param message
 * @returns
 */
export async function updateChatMessage(
  chatId: string,
  messageId: string,
  message: AiPilotChat["messages"][0]
) {
  const collection = await getCollection<AiPilotChat>("ai_pilot_chats");

  const result = await collection.updateOne(
    { uuid: chatId, "messages.uuid": messageId },
    { $set: { "messages.$": message } }
  );

  if (result.matchedCount === 0) {
    throw customError(404, "Chat or message not found");
  }

  return { success: true };
}
