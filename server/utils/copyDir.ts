import { cp } from "node:fs/promises";

/**
 * Copy files recursively from the src directory to the dest directory
 *
 * @param srcDir
 * @param destDir
 * @param options
 */
export async function copyDir(
  srcDir: string,
  destDir: string,
  options: { replace: boolean; preserveTimestamps: boolean }
) {
  await cp(srcDir, destDir, {
    recursive: true,

    force: options.replace ? true : false,
    errorOnExist: false,
    preserveTimestamps: options.preserveTimestamps,
  });
}
