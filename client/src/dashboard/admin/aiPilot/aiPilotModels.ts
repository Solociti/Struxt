import { getApi, postApi } from "client/api/api";
import { AiPilotModels } from "common/api/aiPilot/chatApi";
import { AiPilotModel } from "common/models/aiPilot/AiPilotModels";

/**
 * Get the complete list of AI Pilot models from the server
 */
export async function getAiPilotModels(): Promise<AiPilotModel[]> {
  const response: AiPilotModels["GetResponse"] = await getApi([
    "/api/aiPilot/models",
  ]);

  return response.models.map((m: any) => new AiPilotModel(m));
}

/**
 * Save an AI Pilot model to the server
 *
 * @param model
 * @returns
 */
export async function saveAiPilotModel(model: AiPilotModel) {
  const response = await postApi(["/api/aiPilot/models"], { model });

  return response;
}
