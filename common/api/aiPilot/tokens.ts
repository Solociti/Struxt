import { TokenWallet } from "common/models/aiPilot/TokenWallet";
import { Api } from "../api";

export interface AiPilotTokenWallet extends Api {
  Endpoint: "/api/aiPilot/tokens";

  GetQuery: {
    projectId: string;
  };
  GetResponse: { wallet: TokenWallet };
}
