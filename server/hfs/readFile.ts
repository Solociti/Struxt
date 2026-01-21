import { readFile } from "node:fs/promises";
import { isPathInside } from "./path";
import { createReadStream } from "node:fs";

interface ReadFileOptions {
  /**
   * When set, the file must be nested inside this directory
   */
  restrictedTo?: string;
  encoding?: BufferEncoding;
}

/**
 * Reads a file from the file system
 *
 * @param path
 * @param param1
 * @returns
 */
export async function hfsReadFile(
  path: string,
  { restrictedTo, encoding }: ReadFileOptions,
) {
  if (restrictedTo) {
    if (!isPathInside(path, restrictedTo)) {
      throw new Error("Could not read the requested file.");
    }
  }

  return await readFile(path, {
    encoding,
  });
}

/**
 * Reads a file as a stream
 *
 * @param path
 * @param param1
 * @returns
 */
export async function hfsReadFileStream(
  path: string,
  {
    restrictedTo,
    encoding,
    ...readOptions
  }: ReadFileOptions & { autoClose?: boolean; start?: number; end?: number },
) {
  if (restrictedTo) {
    if (!isPathInside(path, restrictedTo)) {
      throw new Error("Could not read the requested file.");
    }
  }

  return createReadStream(path, {
    encoding,
    autoClose: true,
    ...readOptions,
  });
}
