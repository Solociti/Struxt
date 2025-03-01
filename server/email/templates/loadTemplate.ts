import Handlebars from "handlebars";
import { readFile } from "node:fs/promises";

/**
 * Load the given html template file
 *
 * @param name
 * @returns
 */
export async function loadTemplate(name: string) {
  const html = await readFile(`server/email/templates/${name}.html`, "utf-8");

  const template = Handlebars.compile(html);
  return template;
}
