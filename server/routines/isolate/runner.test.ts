import { describe, expect, it, vi } from "vitest";
import { runUnsafeFunction } from "./runners";

describe("runUnsafeFunction", () => {
  const consoleRecorder = (
    type: "log" | "info" | "warn" | "error" | "debug",
    args: any[]
  ) => {
    // ignore input for tests
  };

  const timeRecorder = (
    wallExecutionTimeMs: number,
    cpuExecutionTimeMs: number,
    wallTimeMs: number
  ) => {
    // ignore input for tests
  };

  it("should execute a simple function successfully", async () => {
    const code = `
      export default {
        main: () => {
          return "Hello World";
        }
      }
    `;

    const result = await runUnsafeFunction(
      {
        exec: code,
        executionId: "test-1",
        entryPoint: "main",
        timeout: 1000,
      },
      consoleRecorder,
      timeRecorder
    );

    expect(result).toBe("Hello World");
  });

  it("should fail if entry point does not exist", async () => {
    const code = `
      export default {
        main: () => "Hello"
      }
    `;

    await expect(
      runUnsafeFunction(
        {
          exec: code,
          executionId: "test-2",
          entryPoint: "missing",
          timeout: 1000,
        },
        consoleRecorder,
        timeRecorder
      )
    ).rejects.toThrow("Method 'missing' is not a function");
  });

  it("should fail if default export is missing", async () => {
    const code = `
      export const main = () => "Hello";
    `;

    await expect(
      runUnsafeFunction(
        {
          exec: code,
          executionId: "test-3",
          entryPoint: "main",
          timeout: 1000,
        },
        consoleRecorder,
        timeRecorder
      )
    ).rejects.toThrow("Default export must be an object");
  });

  it("should timeout if function takes too long", async () => {
    const code = `
      export default {
        main: () => {
          while(true) {}
        }
      }
    `;

    await expect(
      runUnsafeFunction(
        {
          exec: code,
          executionId: "test-4",
          entryPoint: "main",
          timeout: 100,
        },
        consoleRecorder,
        timeRecorder
      )
    ).rejects.toThrow();
  });

  it("should allow using console.log", async () => {
    const code = `
      export default {
        main: () => {
          console.log("Test log");
          return true;
        }
      }
    `;

    // Spy on console.log to verify it's called
    const consoleRecorderSpy = vi.fn();

    const result = await runUnsafeFunction(
      {
        exec: code,
        executionId: "test-5",
        entryPoint: "main",
        timeout: 1000,
      },
      consoleRecorderSpy,
      timeRecorder
    );

    expect(result).toBe(true);
    expect(consoleRecorderSpy).toHaveBeenCalledWith("log", ["Test log"]);
  });

  it("should allow using wait function", async () => {
    const code = `
      export default {
        main: async () => {
          await wait(10);
          return "waited";
        }
      }
    `;

    const result = await runUnsafeFunction(
      {
        exec: code,
        executionId: "test-6",
        entryPoint: "main",
        timeout: 1000,
      },
      consoleRecorder,
      timeRecorder
    );

    expect(result).toBe("waited");
  });

  it("should expose fetch and getDb (even if not fully implemented)", async () => {
    const code = `
      export default {
        main: async () => {
          const f = typeof fetch;
          const d = typeof getDb;
          return [f, d].join("|");
        }
      }
    `;

    const result = await runUnsafeFunction(
      {
        exec: code,
        executionId: "test-7",
        entryPoint: "main",
        timeout: 1000,
      },
      consoleRecorder,
      timeRecorder
    );

    expect(result).toBe("function|function");
  });
});
