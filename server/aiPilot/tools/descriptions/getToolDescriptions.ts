import { ToolDescriptions } from "common/models/aiPilot/tools/ToolDescriptions";

/**
 * Get the tool descriptions for the AI Pilot tools.
 *
 * Only overwrites are stored in the settings,
 * so this method merges the defaults with any overwrites.
 *
 * @param model Optionally provide the model name for model-specific descriptions
 */
export async function getToolDescriptions(
  model?: string
): Promise<ToolDescriptions> {
  const descriptions = new ToolDescriptions();

  // TODO: Load from settings when available

  return descriptions;
}
