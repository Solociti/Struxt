import { existsSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

export async function calcDirSize(dir: string): Promise<number> {
  // check if the directory exists
  if (!existsSync(dir)) {
    return 0;
  }

  const files = await readdir(dir);

  const sizes = await Promise.all(
    files.map(async (file) => {
      const filePath = join(dir, file);

      const st = await stat(filePath);
      if (st.isDirectory()) {
        return calcDirSize(filePath);
      } else {
        return st.size;
      }
    })
  );

  return sizes.reduce((acc: number, val: number) => acc + val, 0);
}
