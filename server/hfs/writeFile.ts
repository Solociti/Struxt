import { writeFile } from "node:fs/promises";
import { isPathInside } from "./path";
import { createWriteStream } from "node:fs";

interface WriteFileOptions {
  /**
   * When set, the file must be nested inside this directory
   */
  restrictedTo?: string;
  encoding?: BufferEncoding;
}

/**
 * Writes a file to the file system
 *
 * @param path
 * @param param1
 * @returns
 */
export async function hfsWriteFile(
  path: string,
  data: string | Buffer,
  { restrictedTo, encoding }: WriteFileOptions,
) {
  if (restrictedTo) {
    if (!isPathInside(path, restrictedTo)) {
      throw new Error("Could not write the requested file.");
    }
  }
  await writeFile(path, data, {
    encoding,
  });
}

/**
 * Writes a file as a stream
 *
 * @param path
 * @param param1
 * @returns
 */
export async function hfsWriteFileStream(
  path: string,
  { restrictedTo, encoding }: WriteFileOptions,
) {
  if (restrictedTo) {
    if (!isPathInside(path, restrictedTo)) {
      throw new Error("Could not write the requested file.");
    }
  }

  return await createWriteStream(path, {
    encoding,
    autoClose: true,
  });
}
