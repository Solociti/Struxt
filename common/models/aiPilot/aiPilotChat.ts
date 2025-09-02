import { Model, UserModelAction } from "../Model";
import { DeepPartial, mergeDeep } from "../utils";
import { AiChatMessage, UserChatMessage } from "./ChatMessage";

export class AiPilotChat extends Model {
  /**
   * The chat ID.
   */
  public uuid = "";

  /**
   * The project ID this chat belongs to.
   */
  public projectId = "";

  /**
   * Information about who and when this chat was created.
   */
  public created: Omit<UserModelAction, "active"> = {
    date: Math.floor(Date.now() / 1000),
    userId: "",
    displayName: "",
  };

  /**
   * Soft delete information.
   *
   * Need to purge from database after x days.
   */
  public deleted: UserModelAction = {
    active: false,
    date: 0,
    userId: "",
    displayName: "",
  };

  public messages: (UserChatMessage | AiChatMessage)[] = [];

  constructor(data?: DeepPartial<AiPilotChat>) {
    super();

    if (data) {
      this.update(data);
    }
  }

  update(data: DeepPartial<AiPilotChat>) {
    mergeDeep(this, data);
  }

  clone(): AiPilotChat {
    const data = JSON.parse(JSON.stringify(this));
    return new AiPilotChat(data);
  }
}

export interface AiPilotChatListItem {
  uuid: string;

  projectId: string;

  created: Omit<UserModelAction, "active">;
}
