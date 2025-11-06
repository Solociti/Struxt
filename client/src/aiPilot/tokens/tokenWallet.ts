import { getApi } from "client/api/api";
import { AiPilotTokenWallet } from "common/api/aiPilot/tokens";
import { TokenWallet } from "common/models/aiPilot/TokenWallet";

/**
 * Get the token wallet for a project
 *
 * @param projectId
 * @returns
 */
export async function getTokenWallet(projectId: string): Promise<TokenWallet> {
  const params: AiPilotTokenWallet["GetQuery"] = { projectId };

  const response: AiPilotTokenWallet["GetResponse"] = await getApi(
    "/api/aiPilot/tokens",
    params
  );

  return new TokenWallet(response.wallet);
}
