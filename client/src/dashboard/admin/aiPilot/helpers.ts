import { ToolKeys, toolNames } from "common/api/aiPilot/toolNames";
import { AiPilotModel } from "common/models/aiPilot/AiPilotModels";
import { AiPilotPrompts } from "common/models/aiPilot/tools/AiPilotPrompts";
import { PromptOverrides } from "common/models/aiPilot/tools/PromptOverrides";

export interface VendorItem {
  id: string;
  name: string;
}

export interface ModelItem {
  id: string;
  name: string;
  vendorId: string;
}

/**
 * Create a list of unique vendors and models from the list of all models
 *
 * @param allModels
 * @returns
 */
export function extractVendorsAndModels(allModels: AiPilotModel[]) {
  const vendorIds: string[] = [];
  const vendors: VendorItem[] = [];

  const modelIds: string[] = [];
  const models: ModelItem[] = [];

  for (const m of allModels) {
    const { model: modelId, vendor: vendorId } = m.splitId();

    if (!vendorIds.includes(vendorId)) {
      vendorIds.push(vendorId);
      vendors.push({ id: vendorId, name: m.vendor });
    }

    if (!modelIds.includes(modelId)) {
      modelIds.push(modelId);
      models.push({ id: m.modelName, name: m.modelName, vendorId: vendorId });
    }
  }

  return { vendorList: vendors, modelList: models };
}

/**
 * Get the display name for a prompt key
 *
 * @param promptKey
 */
export function getPromptKeyName(promptKey: PromptOverrides["key"]) {
  const prompts = new AiPilotPrompts();

  let title = "Unknown";
  let subTitle = "";

  if (promptKey === "agentPrompt") {
    title = "Agent Prompt";
  } else if (promptKey in prompts.tools) {
    // setup titles for tools
    title = toolNames[promptKey as ToolKeys].displayName || promptKey;
  } else if (promptKey in prompts.schemas) {
    // setup titles for schemas
    const [toolName, ...rest] = promptKey.split(".");

    title = toolNames[toolName as ToolKeys]
      ? toolNames[toolName as ToolKeys].displayName
      : toolName;
    subTitle = rest.join(".");
  }

  return {
    title,
    subTitle,
  };
}
