import { customError, ErrorNames } from "common/custom-error/custom-error";
import ivm from "isolated-vm";

if (process.env.CONTAINER_NAME !== "function-runner" && !process.env.VITEST) {
  throw new Error(
    "This file should only be imported in the function runner container"
  );
}

/**
 * Executes a function in a separate process.
 *
 * Use this to execute all "serverless" or user routines.
 *
 * @param param0
 * @returns
 */
export async function runUnsafeFunction(
  {
    exec,
    executionId,
    entryPoint,
    timeout,
  }: {
    exec: string;
    executionId: string;
    entryPoint: string;
    timeout: number;
  },
  consoleRecorder: (
    type: "log" | "info" | "warn" | "error" | "debug",
    args: any[]
  ) => void,
  timeRecorder: (
    wallExecutionTimeMs: number,
    cpuExecutionTimeMs: number,
    wallTimeMs: number
  ) => void
) {
  const isolate = new ivm.Isolate({
    memoryLimit: 128,
    onCatastrophicError: (err) => {
      console.error("Isolated VM execution error:", err);
      // TODO: research on how to handle this error
      // potentially, we need to nuke the server and restart it.
    },
  });

  const cleanup = () => {
    // get the execution time
    // the returned time is in nanoseconds and we need to convert it to milliseconds
    const wallExecutionTimeMs = Number(isolate.wallTime) / 1e6;
    const cpuExecutionTimeMs = Number(isolate.cpuTime) / 1e6;

    const wallTimeMs = Date.now() - startTime;

    timeRecorder(wallExecutionTimeMs, cpuExecutionTimeMs, wallTimeMs);

    // clean up the used resources
    isolate.dispose();
  };

  let startTime = Date.now();

  try {
    const context = await isolate.createContext();
    const jail = context.global;
    await jail.set("global", jail.derefInto());

    // setup the methods we want to expose to the sandboxed code.
    const cns = await jail.get("console");
    await cns.set("console", cns.derefInto());

    await cns.set("log", (...args: any[]) => consoleRecorder("log", args));
    await cns.set("warn", (...args: any[]) => consoleRecorder("warn", args));
    await cns.set("error", (...args: any[]) => consoleRecorder("error", args));
    await cns.set("info", (...args: any[]) => consoleRecorder("info", args));
    await cns.set("debug", (...args: any[]) => consoleRecorder("debug", args));

    await jail.set("fetch", (url: string, options?: any) => {
      // TODO: implement this function
      // we need to be able to make requests to other services.
      // this is a good place to add rate limiting.
      // we can also add a whitelist of allowed IPs.
    });

    await jail.set("getDb", async () => {
      // TODO: implement this function
      // we need to be able to access the database.
      // this is a good place to add rate limiting.
    });

    // 1. Create a Reference to your host function
    const waitCallback = new ivm.Reference(async (ms: number) => {
      return new Promise((resolve) => setTimeout(resolve, ms));
    });

    // 2. Set the reference on the global object (e.g. as 'waitRef')
    await jail.set("waitRef", waitCallback);

    // 3. Evaluate a script in the isolate to create the 'wait' function wrapper
    //    This wrapper calls 'waitRef.apply' and handles the promise result.
    await context.eval(`
      global.wait = function(ms) {
        return waitRef.apply(undefined, [ms], { result: { promise: true } });
      };
    `);

    // compile the code
    const module = await isolate.compileModule(exec);

    await module.instantiate(context, (specifier, referrer) => {
      throw new Error(`Imports are not allowed: ${specifier}`);
    });

    await module.evaluate();

    const namespace = module.namespace;
    const defaultExport = await namespace.get("default", {
      reference: true,
    });

    if (!defaultExport || defaultExport.typeof !== "object") {
      throw customError(400, "Default export must be an object.");
    }

    // determine which method to run
    const fnRef = await defaultExport.get(entryPoint, { reference: true });

    if (!fnRef || fnRef.typeof !== "function") {
      throw customError(400, `Method '${entryPoint}' is not a function.`);
    }

    const result = await fnRef.apply(undefined, [], {
      result: { promise: true, copy: true },
      timeout,
    });

    return result;
  } catch (err) {
    if (err instanceof Error && err.status) {
      throw err;
    }

    throw customError(
      500,
      (err as Error).message || "Error running code",
      ((err as Error).name as any) || ErrorNames.ExecutionError
    );
  } finally {
    cleanup();
  }
}
