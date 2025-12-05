import { customError, ErrorNames } from "common/custom-error/custom-error";
import ivm from "isolated-vm";

if (process.env.CONTAINER_NAME !== "function-runner") {
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
export async function runUnsafeFunction({ body }: { body: any }) {
  // TODO: handle server restart requests durning execution.

  const isolate = new ivm.Isolate({
    memoryLimit: 128,
    onCatastrophicError: (err) => {
      console.error("Isolated VM execution error:", err);
      // TODO: research on how to handle this error
      // potentially, we need to nuke the server and restart it.
    },
  });

  const cleanup = () => {
    isolate.dispose();
  };

  try {
    const context = await isolate.createContext();
    const jail = context.global;
    await jail.set("global", jail.derefInto());

    // setup the methods we want to expose to the sandboxed code.
    const cns = await jail.get("console");
    await cns.set("console", cns.derefInto());

    await cns.set("log", (...args: any[]) => console.log(...args));
    await cns.set("warn", (...args: any[]) => console.warn(...args));
    await cns.set("error", (...args: any[]) => console.error(...args));
    await cns.set("info", (...args: any[]) => console.info(...args));
    await cns.set("debug", (...args: any[]) => console.debug(...args));

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

    // compile the code
    const module = await isolate.compileModule(body.exec);

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
    const methodToRun = body.entryPoint;
    const fnRef = await defaultExport.get(methodToRun, { reference: true });

    if (!fnRef || fnRef.typeof !== "function") {
      throw customError(400, `Method '${methodToRun}' is not a function.`);
    }

    const result = await fnRef.apply(undefined, [], {
      result: { promise: true, copy: true },
      timeout: body.timeout,
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
