import { Model, UserModelAction } from "../Model";
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
}
