import { ToolKeys } from "common/api/aiPilot/toolNames";
import { Model, UserModelAction } from "common/models/Model";
import { DeepPartial, mergeDeep } from "common/models/utils";
import { AiPilotPrompts } from "./AiPilotPrompts";

export class PromptOverrides extends Model {
  /**
   * The unique identifier for this override.
   */
  public uuid: string = "";

  /**
   * The list of vendors that this override applies to.
   */
  public vendors: string[] = [];

  /**
   * The list of models that this override applies to.
   */
  public models: string[] = [];

  /**
   * The key of the prompt to override.
   */
  public key: "agentPrompt" | ToolKeys | keyof AiPilotPrompts["schemas"] =
    "agentPrompt";

  /**
   * The override prompt text.
   */
  public prompt: string = "";

  public created: Omit<UserModelAction, "active"> = {
    date: Math.floor(Date.now() / 1000),
    userId: "",
    displayName: "",
  };

  public updated: Omit<UserModelAction, "active"> = {
    date: Math.floor(Date.now() / 1000),
    userId: "",
    displayName: "",
  };

  public archived: UserModelAction = {
    active: false,
    date: 0,
    userId: "",
    displayName: "",
  };

  constructor(data?: DeepPartial<PromptOverrides>) {
    super();
    if (data) {
      this.update(data);
    }
  }

  /**
   * Update the prompt overrides with new data
   *
   * @param data
   */
  update(data: DeepPartial<PromptOverrides>) {
    mergeDeep(this, data);
  }

  clone() {
    return new PromptOverrides(JSON.parse(JSON.stringify(this)));
  }

  isDefault() {
    return this.vendors.length === 0 && this.models.length === 0;
  }

  /**
   * Check if the given vendor matches this override
   *
   * @param vendor
   * @returns
   */
  isVendorMatch(vendor: string) {
    return this.vendors.includes(vendor);
  }

  /**
   * Check if the given model matches this override
   *
   * @param model
   * @returns
   */
  isModelMatch(model: string) {
    return this.models.includes(model);
  }

  /**
   * Apply this override to the given prompts
   *
   * @param prompts
   */
  applyOverride(prompts: AiPilotPrompts) {
    const key = this.key;

    if (key === "agentPrompt") {
      prompts.agentPrompt = this.prompt;
    } else if (key in prompts.tools) {
      prompts.tools[key as ToolKeys] = this.prompt;
    } else if (key in prompts.schemas) {
      prompts.schemas[key as keyof typeof prompts.schemas] = this.prompt;
    }
  }
}
