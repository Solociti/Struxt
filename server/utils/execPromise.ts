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

/**
 * Exec a command in a shell with the given options
 *
 * @param command
 * @param options
 * @returns
 */
export async function execPromise(
  command: string,
  options?: {
    cwd?: string;
    env?: Record<string, string>;
    log?: (message: string) => void;
  }
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      "/bin/sh",
      ["-c", command],
      {
        cwd: options?.cwd,
        env: {
          ...process.env,
          ...(options?.env || {}),
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

    if (options && options.log) {
      if (child.stdout) {
        child.stdout.on("data", (data: Buffer) => {
          options.log!("Log: " + data.toString());
        });
      }
      if (child.stderr) {
        child.stderr.on("data", (data: Buffer) => {
          options.log!("Err: " + data.toString());
        });
      }
    }
  });
}
