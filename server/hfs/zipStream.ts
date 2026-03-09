import { ZipWriterStream } from "@zip.js/zip.js";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { relative } from "node:path";
import { Readable } from "node:stream";
import { ReadableStream as ReadableWebStream } from "node:stream/web";
import { isPathInside } from "./path";

/**
 * Creates a zip file stream of the given files
 *
 * @param files
 * @param param2
 */
export async function createZipStream(
  files: string[],
  { restrictedTo, relativeTo }: { restrictedTo: string; relativeTo?: string },
) {
  // create a zip stream of the files
  const zipper = new ZipWriterStream();
  const stream = Readable.fromWeb(
    zipper.readable as ReadableWebStream<Uint8Array>,
  );

  const done = (async () => {
    for (const file of files) {
      if (!isPathInside(file, restrictedTo)) {
        continue;
      }

      const st = await stat(file);
      if (st.isDirectory()) {
        continue;
      }

      let fileName = file;
      // rewrite the file name to be relative to the given directory if specified
      if (relativeTo) {
        fileName = relative(relativeTo, file);
      }

      const fileStream = await createReadStream(file);

      await Readable.toWeb(fileStream).pipeTo(zipper.writable(fileName));
    }

    await zipper.close();
  })().catch((err) => {
    stream.destroy(err);
  });

  return { stream, done };
}
