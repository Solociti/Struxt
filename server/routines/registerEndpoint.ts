import { FunctionRunnerRoutes } from "server/utils/internal/internalRoutes";
import { setupInternalRoute } from "server/utils/internal/setupInternalRoute";
import { runUnsafeFunction } from "./isolate/runners";

setupInternalRoute<FunctionRunnerRoutes>(
  "/routines/exec",
  async (inputBody) => {
    const result = await runUnsafeFunction(inputBody);

    return {
      ...result,
      success: true,
    };
  }
);
