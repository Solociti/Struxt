import { execFile } from "node:child_process";

/**
 * Exec a file with the given arguments and environment variables
 *
 * @param file
 * @param args
 * @param env
 * @returns
 */
export async function execFilePromise(
  file: string,
  args: string[],
  env?: Record<string, string>
) {
  return new Promise((resolve, reject) => {
    execFile(
      file,
      args,
      {
        env: {
          ...process.env,
          ...(env || {}),
        },
      },
      (error, stdout, stderr) => {
        if (error) {
          console.log(error, { stdout, stderr });
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      }
    );
  });
}
