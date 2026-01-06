import { getApi, postApi } from "client/api/api";
import { AiPilotPrompts as AiPilotPromptsApi } from "common/api/aiPilot/chatApi";
import { AiPilotModel } from "common/models/aiPilot/AiPilotModels";
import { AiPilotPrompts } from "common/models/aiPilot/tools/AiPilotPrompts";
import { PromptOverrides } from "common/models/aiPilot/tools/PromptOverrides";

/**
 * Get the list of all AI Pilot prompt overrides from the database
 */
export async function getAiPilotPrompts(): Promise<
  AiPilotPromptsApi["GetResponse"]
> {
  const response = await getApi<AiPilotPromptsApi>([
    "/api/aiPilot/prompts",
  ]);

  response.defaultPrompts = new AiPilotPrompts(response.defaultPrompts);
  response.overrides = response.overrides.map(
    (o: any) => new PromptOverrides(o)
  );
  response.models = response.models.map((m: any) => new AiPilotModel(m));

  return response;
}

/**
 * Save the prompt override to the database
 *
 * @param override
 * @returns
 */
export async function saveAiPilotPromptOverride(override: PromptOverrides) {
  const body: AiPilotPromptsApi["PostBody"] = {
    prompt: override,
  };

  const response = await postApi<AiPilotPromptsApi>(
    ["/api/aiPilot/prompts"],
    body
  );

  return response;
}
