import Handlebars from "handlebars";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const __dirname = join(process.cwd(), "templates/email");

/**
 * Load the given html template file
 *
 * @param name
 * @returns
 */
export async function loadTemplate(name: string) {
  const html = await readFile(join(__dirname, `/${name}.html`), "utf-8");

  const template = Handlebars.compile(html);
  return template;
}
