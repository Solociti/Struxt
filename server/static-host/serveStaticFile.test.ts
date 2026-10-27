import { mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join } from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { serveStaticFile } from "./serveStaticFile";

const TEST_DIR = join(tmpdir(), "struxt-static-test-" + Date.now());

function createReq(path: string, method = "GET") {
  return { path, method, headers: {} } as any;
}

function createRes() {
  const res: any = {
    _status: 0,
    _headers: {} as Record<string, string | number>,
    _redirectUrl: "",
    headersSent: false,

    status(code: number) {
      res._status = code;
      return res;
    },
    setHeader(name: string, value: string | number) {
      res._headers[name.toLowerCase()] = value;
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
      const root = opts.root ?? "";
      const fullPath = isAbsolute(path) ? path : join(root, path);
      // Simulate send: try direct path, then extensions
      const candidates = [
        fullPath,
        ...(opts.extensions ?? []).map((e: string) => `${fullPath}.${e}`),
      ];
      for (const candidate of candidates) {
        try {
          if (statSync(candidate).isFile()) {
            res._sendFilePath = candidate;
            res._status = 200;
            cb();
            return;
          }
        } catch {}
      }
      cb(Object.assign(new Error("ENOENT"), { code: "ENOENT" }));
    },
  };
  return res;
}

beforeAll(() => {
  mkdirSync(TEST_DIR, { recursive: true });
  mkdirSync(join(TEST_DIR, "css"), { recursive: true });
  mkdirSync(join(TEST_DIR, "contacts"), { recursive: true });
  mkdirSync(join(TEST_DIR, "empty-dir"), { recursive: true });
  mkdirSync(join(TEST_DIR, ".hidden"), { recursive: true });

  writeFileSync(join(TEST_DIR, "index.html"), "<html>home</html>");
  writeFileSync(join(TEST_DIR, "about.html"), "<html>about</html>");
  writeFileSync(join(TEST_DIR, "css", "main.css"), "body { color: red; }");
  writeFileSync(
    join(TEST_DIR, "contacts", "index.html"),
    "<html>contacts</html>",
  );
  writeFileSync(join(TEST_DIR, ".env"), "SECRET=abc");
  writeFileSync(join(TEST_DIR, ".hidden", "secret.txt"), "hidden");
});

afterAll(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
});

describe("serveStaticFile", () => {
  describe("basic file serving", () => {
    test("serves a direct file", async () => {
      const req = createReq("/css/main.css");
      const res = createRes();
      const handled = await serveStaticFile(
        TEST_DIR,
        "/css/main.css",
        req,
        res,
      );
      expect(handled).toBe(true);
      expect(res._status).toBe(200);
      expect(res._sendFilePath).toContain("main.css");
    });

    test("serves index.html for root path", async () => {
      const req = createReq("/");
      const res = createRes();
      const handled = await serveStaticFile(TEST_DIR, "/", req, res);
      expect(handled).toBe(true);
      expect(res._sendFilePath).toContain("index.html");
    });

    test("serves index.html for empty path", async () => {
      const req = createReq("");
      const res = createRes();
      const handled = await serveStaticFile(TEST_DIR, "", req, res);
      expect(handled).toBe(true);
      expect(res._sendFilePath).toContain("index.html");
    });

    test("returns false for nonexistent file", async () => {
      const req = createReq("/nope.html");
      const res = createRes();
      const handled = await serveStaticFile(TEST_DIR, "/nope.html", req, res);
      expect(handled).toBe(false);
    });
  });

  describe("clean URL resolution", () => {
    test("/contacts resolves to contacts/index.html", async () => {
      const req = createReq("/contacts");
      const res = createRes();
      const handled = await serveStaticFile(TEST_DIR, "/contacts", req, res);
      expect(handled).toBe(true);
      expect(res._sendFilePath).toContain(join("contacts", "index.html"));
    });

    test("/contacts/ resolves to contacts/index.html", async () => {
      const req = createReq("/contacts/");
      const res = createRes();
      const handled = await serveStaticFile(TEST_DIR, "/contacts/", req, res);
      expect(handled).toBe(true);
      expect(res._sendFilePath).toContain(join("contacts", "index.html"));
    });

    test("/about resolves to about.html", async () => {
      const req = createReq("/about");
      const res = createRes();
      const handled = await serveStaticFile(TEST_DIR, "/about", req, res);
      expect(handled).toBe(true);
      expect(res._sendFilePath).toContain("about.html");
    });

    test("index.html takes priority over .html fallback", async () => {
      writeFileSync(
        join(TEST_DIR, "contacts.html"),
        "<html>contacts page</html>",
      );
      const req = createReq("/contacts");
      const res = createRes();
      await serveStaticFile(TEST_DIR, "/contacts", req, res);
      expect(res._sendFilePath).toContain(join("contacts", "index.html"));
      rmSync(join(TEST_DIR, "contacts.html"));
    });

    test("directory without index.html returns false", async () => {
      const req = createReq("/empty-dir");
      const res = createRes();
      const handled = await serveStaticFile(TEST_DIR, "/empty-dir", req, res);
      expect(handled).toBe(false);
    });

    test("/about/ also resolves to about.html", async () => {
      const req = createReq("/about/");
      const res = createRes();
      const handled = await serveStaticFile(TEST_DIR, "/about/", req, res);
      expect(handled).toBe(true);
      expect(res._sendFilePath).toContain("about.html");
    });
  });

  describe("dotfile blocking", () => {
    test("returns 404 for dotfiles", async () => {
      const req = createReq("/.env");
      const res = createRes();
      const handled = await serveStaticFile(TEST_DIR, "/.env", req, res);
      expect(handled).toBe(true);
      expect(res._status).toBe(404);
    });

    test("returns 404 for files inside hidden directories", async () => {
      const req = createReq("/.hidden/secret.txt");
      const res = createRes();
      const handled = await serveStaticFile(
        TEST_DIR,
        "/.hidden/secret.txt",
        req,
        res,
      );
      expect(handled).toBe(true);
      expect(res._status).toBe(404);
    });

    test("returns 404 for .config.json", async () => {
      writeFileSync(join(TEST_DIR, ".config.json"), "{}");
      const req = createReq("/.config.json");
      const res = createRes();
      const handled = await serveStaticFile(
        TEST_DIR,
        "/.config.json",
        req,
        res,
      );
      expect(handled).toBe(true);
      expect(res._status).toBe(404);
      rmSync(join(TEST_DIR, ".config.json"));
    });
  });

  describe("path traversal prevention", () => {
    test("returns 404 for ../ traversal", async () => {
      const req = createReq("/../../../etc/passwd");
      const res = createRes();
      const handled = await serveStaticFile(
        TEST_DIR,
        "/../../../etc/passwd",
        req,
        res,
      );
      expect(handled).toBe(true);
      expect(res._status).toBe(404);
    });
  });
});
