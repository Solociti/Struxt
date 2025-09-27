import { AiPilotChatListItem } from "common/models/aiPilot/aiPilotChat";
import { AiPilotModel } from "common/models/aiPilot/AiPilotModels";
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
