import { FunctionRunnerRoutes } from "server/utils/internal/internalRoutes";
import { setupInternalRoute } from "server/utils/internal/setupInternalRoute";
import { runUnsafeFunction } from "./isolate/runners";

// TODO: save this to the execution by id in the database
const consoleRecorder = (
  type: "log" | "info" | "warn" | "error" | "debug",
  args: any[]
) => {
  console[type](...args);
};

const timeRecorder = (
  wallExecutionTimeMs: number,
  cpuExecutionTimeMs: number,
  wallTimeMs: number
) => {
  console.log({ wallExecutionTimeMs, cpuExecutionTimeMs, wallTimeMs });
};

setupInternalRoute<FunctionRunnerRoutes>(
  "/routines/exec",
  async (inputBody) => {
    const result = await runUnsafeFunction(
      inputBody,
      consoleRecorder,
      timeRecorder
    );

    return result;
  }
);
