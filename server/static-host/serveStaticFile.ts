import { Request, Response } from "express";
import { Stats } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { join, normalize, relative } from "node:path";
import { isPathInside } from "server/hfs/path";

const HTML_EXTENSIONS = ["html", "htm"];

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

  const resolved = await resolveFilePath(absolutePath);
  if (resolved === null) {
    res.status(404).end();
    return true;
  }

  // The checks above are lexical and can't see symlinks. Re-check containment
  // on the real path of the exact file we're about to serve.
  const realPath = await safeRealpath(resolved.path);
  if (realPath === null) {
    res.status(404).end();
    return true;
  }

  if (!isPathInside(realPath, siteDir)) {
    res.status(404).end();
    return true;
  }

  if (hasDotSegment(realPath) || hasDotSegment(requestPath)) {
    res.status(404).end();
    return true;
  }

  if (resolved.isIndex) {
    const { pathname, search } = splitUrl(req.originalUrl);
    if (!pathname.endsWith("/")) {
      // Strip leading slashes/backslashes so the target can't become protocol-relative
      const target = pathname.replace(/^[/\\]+/, "");

      // Using 302 redirect so customers site doesn't break if they make changes to file structure
      // about/index.html could be replaced with about.html. 301 redirect would break it for cached users.
      res.redirect(302, `/${target}/${search}`);
      return true;
    }
  }

  return new Promise((resolvePromise) => {
    res.sendFile(
      relative(siteDir, realPath),
      { root: siteDir, dotfiles: "ignore" },
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
 * Splits a URL into pathname and search parts.
 *
 * @param url
 * @returns
 */
function splitUrl(url: string): { pathname: string; search: string } {
  const q = url.indexOf("?");
  return q === -1
    ? { pathname: url, search: "" }
    : { pathname: url.slice(0, q), search: url.slice(q) };
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
 * Checks, in order: a direct file, a `{path}/index.html` descent for
 * directories, then the clean URL fallback (e.g. `/about` or `/about/` →
 * `about.html`).
 *
 * @param absolutePath Resolved absolute path (normalized)
 * @returns The file to serve, or `null` if nothing matches
 */
async function resolveFilePath(
  absolutePath: string,
): Promise<{ path: string; isIndex: boolean } | null> {
  const directStat = await safeStat(absolutePath);
  if (directStat?.isFile()) {
    return { path: absolutePath, isIndex: false };
  }

  const indexPath = join(absolutePath, "index.html");
  const indexStat = await safeStat(indexPath);
  if (indexStat?.isFile()) {
    return { path: indexPath, isIndex: true };
  }

  const basePath = absolutePath.replace(/[\\/]+$/, "");
  for (const extension of HTML_EXTENSIONS) {
    const candidatePath = `${basePath}.${extension}`;
    const candidateStat = await safeStat(candidatePath);
    if (candidateStat?.isFile()) {
      return { path: candidatePath, isIndex: false };
    }
  }

  return null;
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

/**
 * Safe `realpath()` that returns `null` instead of throwing on ENOENT/ENOTDIR/ELOOP.
 *
 * @param filePath
 */
async function safeRealpath(filePath: string): Promise<string | null> {
  try {
    return await realpath(filePath);
  } catch {
    return null;
  }
}
