import { createWriteStream, existsSync } from "node:fs";
import {
  mkdtemp,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CommitOnFinishStream from "./CommitOnFinishStream";

let dir: string;
let tempPath: string;
let destPath: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "commit-stream-"));
  tempPath = join(dir, "temp.part");
  destPath = join(dir, "dest.txt");
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

function makeStream(
  commit: () => Promise<void> = async () => {},
  cleanup: () => Promise<void> = async () => {},
  path = tempPath,
) {
  return new CommitOnFinishStream(createWriteStream(path), commit, cleanup);
}

describe("CommitOnFinishStream", () => {
  describe("success path", () => {
    it("writes all data and runs commit exactly once", async () => {
      const commit = vi.fn(async () => {});
      const cleanup = vi.fn(async () => {});

      await pipeline(
        Readable.from(["hello ", "world"]),
        makeStream(commit, cleanup),
      );

      expect(commit).toHaveBeenCalledTimes(1);
      expect(cleanup).not.toHaveBeenCalled();
      expect(await readFile(tempPath, "utf8")).toBe("hello world");
    });

    it("does not resolve pipeline until commit has completed", async () => {
      let releaseCommit!: () => void;
      const commitGate = new Promise<void>((r) => (releaseCommit = r));
      const commit = vi.fn(() => commitGate);

      let pipelineDone = false;
      const p = pipeline(Readable.from(["data"]), makeStream(commit)).then(
        () => {
          pipelineDone = true;
        },
      );

      await vi.waitFor(() => expect(commit).toHaveBeenCalled());
      // give the event loop a few turns; pipeline must still be pending
      await new Promise((r) => setTimeout(r, 25));
      expect(pipelineDone).toBe(false);

      releaseCommit();
      await p;
      expect(pipelineDone).toBe(true);
    });

    it("does not emit 'finish' before commit completes", async () => {
      const events: string[] = [];
      const stream = makeStream(async () => {
        await new Promise((r) => setTimeout(r, 10));
        events.push("commit");
      });
      stream.on("finish", () => events.push("finish"));

      await pipeline(Readable.from(["x"]), stream);

      expect(events).toEqual(["commit", "finish"]);
    });

    it("flushes and closes the file before commit runs", async () => {
      let seenAtCommit = "";
      const commit = async () => {
        seenAtCommit = await readFile(tempPath, "utf8");
      };

      await pipeline(Readable.from(["abc", "def"]), makeStream(commit));

      expect(seenAtCommit).toBe("abcdef");
    });

    it("handles many chunks (backpressure) without losing data", async () => {
      const chunk = Buffer.alloc(64 * 1024, "a");
      const count = 200; // ~12.5 MB
      const source = Readable.from(
        (function* () {
          for (let i = 0; i < count; i++) yield chunk;
        })(),
      );

      await pipeline(source, makeStream());

      expect((await stat(tempPath)).size).toBe(chunk.length * count);
    });

    it("handles an empty source", async () => {
      const commit = vi.fn(async () => {});
      await pipeline(Readable.from([]), makeStream(commit));

      expect(commit).toHaveBeenCalledTimes(1);
      expect((await stat(tempPath)).size).toBe(0);
    });

    it("works with a real rename as the commit step", async () => {
      await writeFile(destPath, "old");

      await pipeline(
        Readable.from(["new content"]),
        makeStream(() => rename(tempPath, destPath)),
      );

      // destination is already updated the moment the pipeline resolves
      expect(await readFile(destPath, "utf8")).toBe("new content");
      expect(existsSync(tempPath)).toBe(false);
    });
  });

  describe("commit failure", () => {
    it("rejects the pipeline with the commit error", async () => {
      const error = new Error("rename failed");

      await expect(
        pipeline(
          Readable.from(["data"]),
          makeStream(async () => {
            throw error;
          }),
        ),
      ).rejects.toBe(error);
    });

    it("runs cleanup after a commit failure", async () => {
      const cleanup = vi.fn(async () => {});

      await expect(
        pipeline(
          Readable.from(["data"]),
          makeStream(async () => {
            throw new Error("rename failed");
          }, cleanup),
        ),
      ).rejects.toThrow("rename failed");

      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it("leaves the destination untouched and removes the temp file", async () => {
      await writeFile(destPath, "old");

      await expect(
        pipeline(
          Readable.from(["new"]),
          makeStream(
            async () => {
              // simulate hfsRenameFile failing
              throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
            },
            () => rm(tempPath, { force: true }),
          ),
        ),
      ).rejects.toThrow("ENOENT");

      expect(await readFile(destPath, "utf8")).toBe("old");
      expect(existsSync(tempPath)).toBe(false);
    });

    it("does not leave an unhandled rejection behind", async () => {
      const unhandled = vi.fn();
      process.on("unhandledRejection", unhandled);
      try {
        await expect(
          pipeline(
            Readable.from(["data"]),
            makeStream(async () => {
              throw new Error("boom");
            }),
          ),
        ).rejects.toThrow("boom");
        await new Promise((r) => setTimeout(r, 25));
        expect(unhandled).not.toHaveBeenCalled();
      } finally {
        process.off("unhandledRejection", unhandled);
      }
    });

    it("reports the original error if cleanup also fails", async () => {
      const commitError = new Error("commit failed");

      await expect(
        pipeline(
          Readable.from(["data"]),
          makeStream(
            async () => {
              throw commitError;
            },
            async () => {
              throw new Error("cleanup failed");
            },
          ),
        ),
      ).rejects.toBe(commitError);
    });
  });

  describe("abort / source errors", () => {
    it("cleans up and skips commit when the source errors mid-stream", async () => {
      const commit = vi.fn(async () => {});
      const cleanup = vi.fn(() => rm(tempPath, { force: true }));
      const sourceError = new Error("client disconnected");

      const source = new Readable({
        read() {
          this.push("partial");
          setImmediate(() => this.destroy(sourceError));
        },
      });

      await expect(pipeline(source, makeStream(commit, cleanup))).rejects.toBe(
        sourceError,
      );

      expect(commit).not.toHaveBeenCalled();
      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(existsSync(tempPath)).toBe(false);
    });

    it("cleans up and skips commit when destroyed before finishing", async () => {
      const commit = vi.fn(async () => {});
      const cleanup = vi.fn(async () => {});
      const stream = makeStream(commit, cleanup);

      stream.write("some data");
      const closed = new Promise((r) => stream.once("close", r));
      stream.destroy();
      await closed;

      expect(commit).not.toHaveBeenCalled();
      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it("waits for the inner file to close before running cleanup", async () => {
      let innerClosedAtCleanup: boolean | undefined;
      const inner = createWriteStream(tempPath);
      const stream = new CommitOnFinishStream(
        inner,
        async () => {},
        async () => {
          innerClosedAtCleanup = inner.closed;
        },
      );

      stream.write("data");
      const closed = new Promise((r) => stream.once("close", r));
      stream.destroy();
      await closed;

      expect(innerClosedAtCleanup).toBe(true);
    });
  });

  describe("inner stream errors", () => {
    it("propagates inner errors to the pipeline and runs cleanup", async () => {
      const cleanup = vi.fn(async () => {});
      const badPath = join(dir, "missing-dir", "file.part");

      await expect(
        pipeline(
          Readable.from(["data"]),
          makeStream(async () => {}, cleanup, badPath),
        ),
      ).rejects.toMatchObject({ code: "ENOENT" });

      expect(cleanup).toHaveBeenCalledTimes(1);
    });
  });

  describe("after successful completion", () => {
    it("does not run cleanup when destroyed after a successful commit", async () => {
      const cleanup = vi.fn(async () => {});
      const stream = makeStream(async () => {}, cleanup);

      await pipeline(Readable.from(["data"]), stream);
      stream.destroy();
      await new Promise((r) => setTimeout(r, 25));

      expect(cleanup).not.toHaveBeenCalled();
    });
  });
});
