import { getDirname } from "cross-dirname";
import Handlebars from "handlebars";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Load the given html template file
 *
 * @param name
 * @returns
 */
export async function loadTemplate(name: string) {
  const dir = getDirname();
  const html = await readFile(join(dir, `/${name}.html`), "utf-8");

  const template = Handlebars.compile(html);
  return template;
}
