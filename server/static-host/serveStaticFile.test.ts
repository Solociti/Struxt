import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { serveStaticFile } from "./serveStaticFile";

const TEST_DIR = mkdtempSync(join(tmpdir(), "struxt-static-"));
const OUTSIDE_DIR = mkdtempSync(join(tmpdir(), "struxt-outside-"));

function write(relPath: string, content: string) {
  const full = join(TEST_DIR, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

/** Minimal Express res. sendFile mimics `send`: direct file, then .html fallback. */
function createRes() {
  const res: any = {
    _status: 0,
    _redirectUrl: undefined as string | undefined,
    _sendFilePath: undefined as string | undefined,
    status(code: number) {
      res._status = code;
      return res;
    },
    end() {
      return res;
    },
    redirect(status: number, url: string) {
      res._status = status;
      res._redirectUrl = url;
    },
    sendFile(path: string, opts: any, cb: (err?: Error) => void) {
      const full = join(opts.root, path);
      const fileStat = statSync(full, { throwIfNoEntry: false });

      if (fileStat?.isFile()) {
        res._sendFilePath = full;
        res._status = 200;
        cb();
        return;
      }

      cb(new Error("ENOENT"));
    },
  };
  return res;
}

/**
 * Calls serveStaticFile like Express would. `requestPath` is derived from the
 * URL unless a test needs it to differ (mount prefixes, decoded paths, odd input).
 */
async function get(
  originalUrl: string,
  requestPath = originalUrl.split("?")[0],
) {
  const res = createRes();
  const handled = await serveStaticFile(
    TEST_DIR,
    requestPath,
    { originalUrl } as any,
    res,
  );
  return { handled, res };
}

function expectNotFound({ handled, res }: Awaited<ReturnType<typeof get>>) {
  expect(handled).toBe(true);
  expect(res._status).toBe(404);
  expect(res._redirectUrl).toBeUndefined();
  expect(res._sendFilePath).toBeUndefined();
}

beforeAll(() => {
  write("index.html", "<html>home</html>");
  write("about.html", "<html>about</html>");
  write("css/main.css", "body { color: red; }");
  write("contacts/index.html", "<html>contacts</html>");
  write("both/index.html", "<html>dir</html>");
  write("both.html", "<html>file</html>");
  write(".env", "SECRET=abc");
  write(".hidden/secret.txt", "hidden");
  mkdirSync(join(TEST_DIR, "empty-dir"));

  write("blog/posts/index.html", "<html>posts</html>");
  write("my docs/index.html", "<html>spaces</html>");
  writeFileSync(join(OUTSIDE_DIR, "secret.txt"), "outside the site");
  if (process.platform !== "win32") {
    symlinkSync(OUTSIDE_DIR, join(TEST_DIR, "escape"));
  }
});

afterAll(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
  rmSync(OUTSIDE_DIR, { recursive: true, force: true });
});

describe("serveStaticFile", () => {
  test("serves a direct file", async () => {
    const { handled, res } = await get("/css/main.css");
    expect(handled).toBe(true);
    expect(res._sendFilePath).toBe(join(TEST_DIR, "css", "main.css"));
  });

  test("serves index.html at root", async () => {
    const { handled, res } = await get("/");
    expect(handled).toBe(true);
    expect(res._sendFilePath).toBe(join(TEST_DIR, "index.html"));
  });

  test("returns false for a nonexistent file", async () => {
    expectNotFound(await get("/nope.html"));
  });

  test("returns false for a directory without index.html", async () => {
    expectNotFound(await get("/empty-dir"));
  });

  describe("clean URLs", () => {
    test("/about falls back to about.html", async () => {
      const { handled, res } = await get("/about");
      expect(handled).toBe(true);
      expect(res._sendFilePath).toBe(join(TEST_DIR, "about.html"));
    });

    test("/about/ also falls back to about.html", async () => {
      const { handled, res } = await get("/about/");
      expect(handled).toBe(true);
      expect(res._sendFilePath).toBe(join(TEST_DIR, "about.html"));
    });
  });

  describe("directory index", () => {
    test("/contacts redirects to /contacts/", async () => {
      const { handled, res } = await get("/contacts");
      expect(handled).toBe(true);
      expect(res._status).toBe(302);
      expect(res._redirectUrl).toBe("/contacts/");
      expect(res._sendFilePath).toBeUndefined();
    });

    test("redirect preserves the query string", async () => {
      const { res } = await get("/contacts?tab=2");
      expect(res._redirectUrl).toBe("/contacts/?tab=2");
    });

    test("/contacts/ serves contacts/index.html", async () => {
      const { handled, res } = await get("/contacts/");
      expect(handled).toBe(true);
      expect(res._redirectUrl).toBeUndefined();
      expect(res._sendFilePath).toBe(join(TEST_DIR, "contacts", "index.html"));
    });

    test("directory wins over a same-named .html file", async () => {
      const slashless = await get("/both");
      expect(slashless.res._redirectUrl).toBe("/both/");

      const slashed = await get("/both/");
      expect(slashed.res._sendFilePath).toBe(
        join(TEST_DIR, "both", "index.html"),
      );
    });
  });

  describe("sandboxing", () => {
    test.each(["/.env", "/.hidden/secret.txt"])("404s for %s", async (url) => {
      expectNotFound(await get(url));
    });

    test("404s for ../ traversal", async () => {
      expectNotFound(await get("/../../../etc/passwd"));
    });
  });

  describe("edge cases", () => {
    describe("redirects", () => {
      test("nested directory redirects with a trailing slash", async () => {
        const { res } = await get("/blog/posts");
        expect(res._redirectUrl).toBe("/blog/posts/");
      });

      test("query string is preserved verbatim", async () => {
        const { res } = await get("/contacts?next=/a//b&q=%20x");
        expect(res._redirectUrl).toBe("/contacts/?next=/a//b&q=%20x");
      });

      test("mount prefix is preserved", async () => {
        const { res } = await get("/sites/abc/contacts", "/contacts");
        expect(res._redirectUrl).toBe("/sites/abc/contacts/");
      });

      test("site root under a prefix redirects when slashless", async () => {
        const { res } = await get("/sites/abc", "");
        expect(res._redirectUrl).toBe("/sites/abc/");
      });

      test("site root under a prefix serves when slashed", async () => {
        const { handled, res } = await get("/sites/abc/", "");
        expect(handled).toBe(true);
        expect(res._redirectUrl).toBeUndefined();
        expect(res._sendFilePath).toBe(join(TEST_DIR, "index.html"));
      });

      // Models a router that passes a decoded requestPath.
      test("directory names needing encoding keep their encoding", async () => {
        const { res } = await get("/my%20docs", "/my docs");
        expect(res._redirectUrl).toBe("/my%20docs/");
      });
    });

    describe("open redirect", () => {
      test("double leading slash never becomes protocol-relative", async () => {
        const { res } = await get("//contacts");
        expect(res._redirectUrl).toBe("/contacts/");
      });

      // "/.//evil.com" normalizes to pathname "//evil.com".
      test("originalUrl that normalizes to //host is neutralized", async () => {
        const { res } = await get("/.//evil.com", "/contacts");
        expect(res._redirectUrl).toBeDefined();
        expect(res._redirectUrl).not.toMatch(/^\/\//);
      });
    });

    describe("sandboxing", () => {
      test("rejects .. segments even when they stay inside the site", async () => {
        expectNotFound(await get("/css/../about.html"));
      });

      test.each(["/%2e%2e/%2e%2e/etc/passwd", "/%2eenv"])(
        "encoded dot segments are never served: %s",
        async (url) => {
          const { res } = await get(url);
          expect(res._sendFilePath).toBeUndefined();
        },
      );

      test.skipIf(process.platform === "win32")(
        "symlink escapes look like missing files, including directory redirects",
        async () => {
          expectNotFound(await get("/escape"));
          expectNotFound(await get("/escape/"));
          expectNotFound(await get("/escape/secret.txt"));
        },
      );
    });
  });
});
