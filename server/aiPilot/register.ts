import { registerObserver } from "server/ws/observers";
import { setupAiPilot } from "./agents/agents";
import z from "zod";
import { customError } from "common/custom-error/custom-error";

registerObserver("aiPilot:chat:open", async (event, query) => {
  const { projectId, chatId } = z
    .object({
      projectId: z.string().min(6, "Project ID is required"),
      chatId: z.string().min(6, "Chat ID is required"),
    })
    .parse(query);

  const agent = await setupAiPilot("chatId", "projectId");

  event.socket.on("aiPilot:chat:message", async (data) => {
    const {
      message,
      projectId: incomingProjectId,
      chatId: incomingChatId,
    } = z
      .object({
        message: z.string().min(1, "Message cannot be empty"),
        chatId: z.string().min(6, "Chat ID is required"),
        projectId: z.string().min(6, "Project ID is required"),
      })
      .parse(data);

    if (incomingProjectId !== projectId || incomingChatId !== chatId) {
      throw customError(400, "Invalid project or chat ID");
    }

    console.log("Message:", data);

    const stream = await agent.streamResponse(message);
    for await (const chunk of stream) {
      event.send({ projectId, chatId, chunk });
    }
  });

  return {
    onUnregister() {
      // TODO: Implement any cleanup logic if necessary
    },
  };
});
