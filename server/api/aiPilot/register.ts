import { AiPilotChatList, AiPilotNewChat } from "common/api/aiPilot/chatApi";
import { customError } from "common/custom-error/custom-error";
import { AiPilotChat } from "common/models/aiPilot/aiPilotChat";
import { roles } from "common/models/user/Roles";
import { saveChat } from "server/aiPilot/chat/saveChat";
import "server/aiPilot/register";
import z from "zod";
import { registerApi } from "../registerApi";
import { loadChatList } from "server/aiPilot/chat/loadChat";

registerApi<AiPilotChatList>("/api/aiPilot/chat/list").get(
  [{ and: [roles.struxt.editor, roles.struxt.aiPilot] }],
  async ({ user, query }) => {
    const { projectId } = z
      .object({
        projectId: z.string().min(6, "Project ID is required"),
      })
      .parse(query);

    // check if the user has access to the project
    if (!user.hasProjectPermission(projectId, [roles.projects.edit])) {
      throw customError(
        403,
        "You do not have permission to modify this project."
      );
    }

    // get the list of chats for the project
    const list = await loadChatList(projectId, 0, 10);

    return {
      list,
    };
  }
);

/**
 * Create a new chat session for the project
 */
registerApi<AiPilotNewChat>("/api/aiPilot/chat/new").post(
  [{ and: [roles.struxt.editor, roles.struxt.aiPilot] }],
  async ({ user, body }) => {
    const { projectId } = z
      .object({
        projectId: z.string().min(6, "Project ID is required"),
      })
      .parse(body);

    // check if the user has access to the project
    if (!user.hasProjectPermission(projectId, [roles.projects.edit])) {
      throw customError(
        403,
        "You do not have permission to modify this project."
      );
    }

    const chat = new AiPilotChat({
      projectId,
      uuid: "new",
      created: {
        date: Math.floor(Date.now() / 1000),
        userId: user.id,
        displayName: user.name,
      },
    });

    const result = await saveChat(chat);
    return result;
  }
);
