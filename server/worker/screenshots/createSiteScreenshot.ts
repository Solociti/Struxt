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
 * @param logger
 */
export async function createSiteScreenshot(
  url: string,
  options: {
    width?: number;
    height?: number;
    fullPage?: boolean;
    interceptHost?: {
      original: string;
      replacement: string;
    };
  } = {},
  logger?: (message: string) => void
) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (request.isInterceptResolutionHandled()) {
      return request.continue();
    }

    let requestUrl = request.url();
    if (!requestUrl.startsWith("http")) {
      return request.continue();
    }

    logger && logger(`Request: ${requestUrl}`);

    // for assets, we need to update the URL to point to the correct path
    // this is necessary because the URL will be the root of the site,
    // instead of relative to the original path
    if (
      options.interceptHost &&
      requestUrl.startsWith(options.interceptHost.original)
    ) {
      const updated = requestUrl.replace(
        options.interceptHost.original,
        options.interceptHost.replacement
      );

      requestUrl = updated;
      logger && logger(`Updated Request: ${requestUrl}`);
    }

    request.continue({
      url: requestUrl,
    });
  });

  page.on("console", (msg) => {
    logger && logger(`Console: ${msg.text()}`);
  });

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
