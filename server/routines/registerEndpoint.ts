import { FunctionRunnerRoutes } from "server/utils/internal/internalRoutes";
import { setupInternalRoute } from "server/utils/internal/setupInternalRoute";
import { runUnsafeFunction } from "./isolate/runners";

setupInternalRoute<FunctionRunnerRoutes>(
  "/routines/exec",
  async (inputBody, { req, res }) => {
    const result = await runUnsafeFunction({ body: inputBody });

    return {
      success: true,
      result,
    };
  }
);
