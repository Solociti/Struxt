import { createWriteStream, existsSync } from "node:fs";
import { rm, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { getTempDir, getUploadDir } from "server/utils/uploadDir";
import { hfsRenameFile } from "./fileOps";
import { isPathInside } from "./path";
import { randomBytes } from "node:crypto";

interface WriteFileOptions {
  /**
   * When set, the file must be nested inside this directory
   */
  restrictedTo?: string;
  encoding?: BufferEncoding;

  /**
   * When true, will write to a temporary file first and then rename it to the final destination.
   *
   * When set to a string, will use that string as the temp file name (instead of a random one).
   */
  useTempFile?: boolean | string;
}

function generateRandom(length = 16) {
  return new Promise((resolve, reject) => {
    randomBytes(length, (err, buf) => {
      if (err) {
        reject(err);
      } else {
        resolve(buf.toString("base64url"));
      }
    });
  });
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
  { restrictedTo, encoding, useTempFile }: WriteFileOptions,
) {
  if (restrictedTo) {
    if (!isPathInside(path, restrictedTo)) {
      throw new Error("Could not write the requested file.");
    }
  }

  let writePath = path;
  if (useTempFile) {
    if (typeof useTempFile === "string") {
      writePath = getTempDir(useTempFile);
    } else {
      let count = 0;
      do {
        count++;
        if (count > 100) {
          throw new Error("Could not create a temporary file for writing.");
        }

        const tempFileName = [await generateRandom(), basename(path)].join("-");
        writePath = getTempDir(tempFileName);
      } while (existsSync(writePath));
    }
  }

  const stream = await createWriteStream(writePath, {
    encoding,
    autoClose: true,
  });

  let completed = false;
  stream.on("finish", async () => {
    completed = true;
    if (useTempFile) {
      await hfsRenameFile(writePath, path, { restrictedTo: getUploadDir() });
    }
  });

  // close event should always be the last event emitted
  stream.on("close", async () => {
    if (!completed && useTempFile && existsSync(writePath)) {
      // if the stream was closed before it finished, delete the temp file
      await rm(writePath);
    }
  });

  return stream;
}
