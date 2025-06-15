import { join } from "node:path";
import puppeteer from "puppeteer";
import { createSimpleId } from "server/utils/createId";
import { mkDirRecursive } from "server/utils/mkDir";
import { getUploadDir } from "server/utils/uploadDir";

/**
 * Render the given URL with puppeteer and save a screenshot of the page.
 *
 * Returns the path to the screenshot.
 *
 * @param url
 * @param options
 */
export async function createSiteScreenshot(
  url: string,
  options: {
    width?: number;
    height?: number;
    fullPage?: boolean;
  } = {}
) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url, {
    waitUntil: "networkidle2",
  });

  await page.setViewport({
    width: options.width || 1600,
    height: options.height || 800,
  });

  const tmpDir = await getUploadDir("temp", "screenshots");
  await mkDirRecursive(tmpDir);

  const name = await createSimpleId("file");
  const screenshotPath = join(tmpDir, `${name}.jpeg`) as `${string}.jpeg`;

  await page.screenshot({
    fullPage: options.fullPage || false,
    path: screenshotPath,
  });

  await browser.close();

  return screenshotPath;
}
