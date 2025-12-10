import { internalRequest } from "server/utils/internal/internalRequest";

/**
 * Runs a function in a separate process.
 */
export async function execRoutine() {
  const code = `
    export default {
      // The user can now group their methods nicely
      get: (req) => {
        console.log("Get called");
        return { test: Math.round(Math.random() * 10) };
      },
      post: async (req) => {
        console.log("Post called");
        return { test: Math.round(Math.random() * 10) };
      }
    };
  `;

  try {
    const response = await internalRequest(
      "function-runner",
      "/routines/exec",
      {
        exec: code,
        entryPoint: "post",
        timeout: 500,
        executionId: "123",
      },
      600
    );

    console.log({ response });
  } catch (err) {
    console.error(err);

    //TODO: re-throw a custom error to send original request

    // throw err;
  }
}
