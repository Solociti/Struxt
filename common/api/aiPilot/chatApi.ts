import { AiPilotChatListItem } from "common/models/aiPilot/aiPilotChat";
import { AiPilotModel } from "common/models/aiPilot/AiPilotModels";
import { AiPilotPrompts as AiPilotPromptsModel } from "common/models/aiPilot/tools/AiPilotPrompts";
import { PromptOverrides } from "common/models/aiPilot/tools/PromptOverrides";
import { Api } from "../api";

export interface AiPilotNewChat extends Api {
  Endpoint: "/api/aiPilot/chat/new";

  PostBody: {
    projectId: string;
  };

  PostResponse: {
    uuid: string;
    success: boolean;
  };
}

export interface AiPilotChatList extends Api {
  Endpoint: "/api/aiPilot/chat/list";

  GetQuery: { projectId: string };
  GetResponse: { list: AiPilotChatListItem[] };
}

export interface AiPilotModels extends Api {
  Endpoint: "/api/aiPilot/models";

  GetQuery: {};
  GetResponse: { models: AiPilotModel[] };

  PostBody: {
    model: AiPilotModel;
  };
  PostResponse: {
    success: boolean;
  };
}

export interface AiPilotPrompts extends Api {
  Endpoint: "/api/aiPilot/prompts";

  GetQuery: {};
  GetResponse: {
    defaultPrompts: AiPilotPromptsModel;
    overrides: PromptOverrides[];
    models: AiPilotModel[];
  };

  PostBody: {
    prompt: PromptOverrides;
  };
  PostResponse: {
    success: boolean;

    uuid: string;
  };
}
