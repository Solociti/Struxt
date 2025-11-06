import {
  AiPilotChatList,
  AiPilotModels,
  AiPilotNewChat,
  AiPilotPrompts as AiPilotPromptsApi,
} from "common/api/aiPilot/chatApi";
import { AiPilotTokenWallet } from "common/api/aiPilot/tokens";
import { customError } from "common/custom-error/custom-error";
import { AiPilotChat } from "common/models/aiPilot/aiPilotChat";
import { AiPilotModel } from "common/models/aiPilot/AiPilotModels";
import { AiPilotPrompts } from "common/models/aiPilot/tools/AiPilotPrompts";
import { PromptOverrides } from "common/models/aiPilot/tools/PromptOverrides";
import { zAiPilotModel } from "common/models/aiPilot/zValidation";
import { roles } from "common/models/user/Roles";
import { DeepPartial } from "common/models/utils";
import { loadChatList } from "server/aiPilot/chat/loadChat";
import { getTokenWallet } from "server/aiPilot/chat/projectTokens";
import { saveChat } from "server/aiPilot/chat/saveChat";
import {
  getAiPilotModel,
  getAiPilotModels,
} from "server/aiPilot/models/getModels";
import { saveAiPilotModel } from "server/aiPilot/models/saveModels";
import "server/aiPilot/register";
import { getAllAiPilotPromptOverrides } from "server/aiPilot/tools/prompts/getAiPilotPrompts";
import { saveAiPilotPrompts } from "server/aiPilot/tools/prompts/saveAiPilotPrompts";
import z from "zod";
import { registerApi } from "../registerApi";
import { aiPilotPermCheck } from "./aiPilotPermCheck";

/**
 * Get the list of AI Pilot chats for a project
 */
registerApi<AiPilotChatList>("/api/aiPilot/chat/list").get(
  [{ and: [roles.struxt.editor, roles.struxt.aiPilot] }],
  async ({ user, query }) => {
    const { projectId } = z
      .object({
        projectId: z.string().min(6, "Project ID is required"),
      })
      .parse(query);

    // check if the user has access to the project
    await aiPilotPermCheck(user, projectId);

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
    await aiPilotPermCheck(user, projectId);

    // create a new chat session
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

registerApi<AiPilotModels>("/api/aiPilot/models")
  .get([roles.struxt.admin], async ({}) => {
    const models = await getAiPilotModels(true);

    return { models };
  })
  .post([roles.struxt.admin], async ({ user, body }) => {
    if (!body.model || typeof body.model !== "object") {
      throw customError(400, "Model is required to save.");
    }

    // check the model shape
    const zModel = zAiPilotModel.parse(body.model);
    const model = new AiPilotModel(zModel);

    // load the existing model if it exists
    const existingModel = await getAiPilotModel(model.id, true);
    if (!existingModel) {
      // new model, set created info
      model.created = {
        ...model.created,
        date: Math.floor(Date.now() / 1000),
        userId: user.id,
        displayName: user.name,
      };
      return await saveAiPilotModel(model);
    }

    // check if the model is being disabled
    if (model.disabled.active && !existingModel.disabled.active) {
      model.disabled = {
        ...model.disabled,
        date: Math.floor(Date.now() / 1000),
        userId: user.id,
        displayName: user.name,
      };
    }

    // save the model to database
    return await saveAiPilotModel(model);
  });

registerApi<AiPilotPromptsApi>("/api/aiPilot/prompts")
  .get([roles.struxt.admin], async ({}) => {
    // get the list of models from the database
    const models = await getAiPilotModels(false);
    // get the list of prompt overrides from the database
    const overrides = await getAllAiPilotPromptOverrides();
    // get the default tool prompts
    const defaultPrompts = new AiPilotPrompts();

    return {
      defaultPrompts,
      overrides,
      models,
    };
  })
  .post([roles.struxt.admin], async ({ user, body }) => {
    if (!body.prompt || typeof body.prompt !== "object") {
      throw customError(400, "Override is required to save.");
    }

    // validate the override shape
    const zOverride = z
      .object({
        uuid: z.string(),
        vendors: z.array(z.string()),
        models: z.array(z.string()),
        key: z.string(),
        prompt: z.string().min(1, "Prompt text is required"),
        created: z.object({
          date: z.number(),
          userId: z.string(),
          displayName: z.string(),
        }),
        updated: z.object({
          date: z.number(),
          userId: z.string(),
          displayName: z.string(),
        }),
        archived: z.object({
          active: z.boolean(),
          date: z.number(),
          userId: z.string(),
          displayName: z.string(),
        }),
      })
      .parse(body.prompt);

    const prompt = new PromptOverrides(
      zOverride as DeepPartial<PromptOverrides>
    );

    if (prompt.uuid === "new") {
      prompt.created = {
        ...prompt.created,
        date: Math.floor(Date.now() / 1000),
        userId: user.id,
        displayName: user.name,
      };
    }

    prompt.updated = {
      ...prompt.updated,
      date: Math.floor(Date.now() / 1000),
      userId: user.id,
      displayName: user.name,
    };

    // set the user that is making the change
    if (prompt.archived.active && !prompt.archived.userId) {
      prompt.archived = {
        ...prompt.archived,
        userId: user.id,
        displayName: user.name,
        date: Math.floor(Date.now() / 1000),
      };
    }

    const result = await saveAiPilotPrompts(prompt);
    return result;
  });

registerApi<AiPilotTokenWallet>("/api/aiPilot/tokens").get(
  [{ and: [roles.struxt.editor, roles.struxt.aiPilot] }, roles.struxt.admin],
  async ({ query, user }) => {
    const { projectId } = z
      .object({
        projectId: z.string().min(6, "Project ID is required"),
      })
      .parse(query);

    // check if the user has access to the project
    if (
      !user.hasPermission(roles.struxt.admin) &&
      !user.hasProjectPermission(projectId, [roles.projects.edit])
    ) {
      throw customError(
        403,
        "You do not have permission to access this project's token wallet."
      );
    }

    const wallet = await getTokenWallet(projectId);

    return { wallet, success: true };
  }
);
