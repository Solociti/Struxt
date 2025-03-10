import { get } from "https";
import { createWriteStream } from "node:fs";
import { join } from "node:path";
import { mkDirRecursive } from "../utils/mkDir.ts";
import { getUploadDir } from "../utils/uploadDir.ts";
import { Job } from "bullmq";

const urls = [
  "https://raw.githubusercontent.com/danielmiessler/SecLists/refs/heads/master/Passwords/Common-Credentials/10-million-password-list-top-10000.txt",
  "https://raw.githubusercontent.com/danielmiessler/SecLists/refs/heads/master/Passwords/Common-Credentials/500-worst-passwords.txt",
  "https://raw.githubusercontent.com/danielmiessler/SecLists/refs/heads/master/Passwords/Common-Credentials/2024-197_most_used_passwords.txt",
  "https://raw.githubusercontent.com/danielmiessler/SecLists/refs/heads/master/Passwords/Common-Credentials/2023-200_most_used_passwords.txt",
];

/**
 * Download a password black lists from github
 */
export async function downloadPasswordLists(job: Job): Promise<void> {
  const finalList: string[] = [];

  const dir = getUploadDir("keycloak");
  await mkDirRecursive(dir);

  for (const url of urls) {
    await job.log(`Downloading ${url}`);
    let beforeCount = finalList.length;
    await downloadFile(url, (line) => {
      // check that the password passes the validation and is not already in the list
      if (validatePassword(line) && !finalList.includes(line)) {
        finalList.push(line);
      }
    });
    await job.log(`Added ${finalList.length - beforeCount} passwords`);
  }

  await job.log(`Total passwords: ${finalList.length}`);

  finalList.sort();

  //  write the list to a file
  const file = createWriteStream(join(dir, "passwords.txt"));
  for (const password of finalList) {
    file.write(password + "\n");
  }
  file.end();
}

/**
 * Validate that the password meets the requirements
 *
 * @param password
 * @returns
 */
function validatePassword(password: string): boolean {
  if (password.length < 8) {
    return false;
  }

  let hasNumber = false;
  let hasLowercase = false;
  let hasUppercase = false;

  for (const char of password) {
    if (char >= "0" && char <= "9") {
      hasNumber = true;
    } else if (char >= "a" && char <= "z") {
      hasLowercase = true;
    } else if (char >= "A" && char <= "Z") {
      hasUppercase = true;
    }
  }
  return hasNumber && hasLowercase && hasUppercase;
}

/**
 * Download a file from the given url and call the callback for each line
 *
 * @param url
 * @param callback
 * @returns
 */
function downloadFile(
  url: string,
  callback: (line: string) => void
): Promise<void> {
  return new Promise((resolve) => {
    get(url, (res) => {
      if (res.statusCode === 302 && res.headers.location) {
        console.log("Redirecting to", res.headers.location);
        downloadFile(res.headers.location, callback).then(resolve);
        return;
      }

      if (res.statusCode !== 200) {
        console.error("Failed to download file", res.statusCode);
        resolve();
        res.resume();
        return;
      }

      let data = "";

      const processData = () => {
        const lines = data.split("\n");

        if (data.endsWith("\n")) {
          data = "";
        } else if (lines.length > 0) {
          data = lines.pop() as string;
        }

        for (const line of lines) {
          callback(line);
        }
      };

      res.on("data", (chunk) => {
        data += chunk.toString();

        processData();
      });

      res.on("end", () => {
        processData();

        resolve();
      });

      res.on("error", (err) => {
        console.error("Failed to download file", err.name, err.message);
        resolve();
      });
    });
  });
}
