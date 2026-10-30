import { Request, Response } from "express";
import { Stats } from "node:fs";
import { stat } from "node:fs/promises";
import { join, normalize, relative } from "node:path";
import { isPathInside } from "server/hfs/path";

/**
 * Serves a static file from a sandboxed site directory.
 *
 * @param siteDir Absolute path to the published site root
 * @param requestPath
 * @param req
 * @param res
 * @returns `true` if a response was sent, `false` if the file was not found
 */
export async function serveStaticFile(
  siteDir: string,
  requestPath: string,
  req: Request,
  res: Response,
): Promise<boolean> {
  const absolutePath = normalize(join(siteDir, requestPath));

  if (!isPathInside(absolutePath, siteDir)) {
    res.status(404).end();
    return true;
  }

  if (hasDotSegment(requestPath)) {
    res.status(404).end();
    return true;
  }

  const { path: resolvedPath, isIndex } = await resolveFilePath(absolutePath);

  if (isIndex) {
    const url = new URL(`http://localhost/${req.originalUrl}`);
    if (!url.pathname.endsWith("/")) {
      const pathname = url.pathname.replace(/\/+$/, "");

      // Using 302 redirect so customers site doesn't break if they make changes to file structure
      // about/index.html could be replaced with about.html. 301 redirect would break it for cached users.
      res.redirect(302, `${pathname}/${url.search}`);
      return true;
    }
  }

  return new Promise((resolvePromise) => {
    res.sendFile(
      relative(siteDir, resolvedPath) || "/",
      { root: siteDir, dotfiles: "ignore", extensions: ["html", "htm"] },
      (err) => {
        if (err) {
          resolvePromise(false);
        } else {
          resolvePromise(true);
        }
      },
    );
  });
}

/**
 * Check if any path segment starts with a dot.
 *
 * @param requestPath
 */
function hasDotSegment(requestPath: string): boolean {
  return requestPath.split("/").some((seg) => seg.startsWith("."));
}

/**
 * Resolve the request path to a file on disk.
 *
 * Checks for a direct file or a `{path}/index.html` descent for directories.
 * The `.html` extension fallback (e.g. `/about` → `about.html`) is delegated
 * to `send` via the `extensions: ["html"]` option on `res.sendFile`.
 *
 * @param absolutePath Resolved absolute path (normalized)
 */
async function resolveFilePath(
  absolutePath: string,
): Promise<{ path: string; isIndex: boolean }> {
  const directStat = await safeStat(absolutePath);
  if (directStat?.isFile()) {
    return { path: absolutePath, isIndex: false };
  }

  const indexPath = join(absolutePath, "index.html");
  const indexStat = await safeStat(indexPath);
  if (indexStat?.isFile()) {
    return { path: indexPath, isIndex: true };
  }

  return { path: absolutePath, isIndex: false };
}

/**
 * Safe `stat()` that returns `null` instead of throwing on ENOENT/ENOTDIR.
 *
 * @param filePath
 */
async function safeStat(filePath: string): Promise<Stats | null> {
  try {
    return await stat(filePath);
  } catch {
    return null;
  }
}
