import { PublishModel } from "common/models/projects/PublishModel";
import express from "express";
import { copyFile, rm as rmFile } from "node:fs/promises";
import { join } from "node:path";
import { getCollection } from "server/database/mongodb";
import { createFlowProducer } from "server/database/setupQueue";
import { getProxyForwardHostUrl } from "server/npm/data/createProxyHostConf";
import { mkDirRecursive } from "server/utils/mkDir";
import { getScreenshotDir } from "server/utils/uploadDir";
import { puppeteerScreenshotQueue } from "server/worker/screenshots/queue";
import { projectScreenshotQueue } from "./queues/setupQueue";

export const staticScreenshotFiles = express.static(getScreenshotDir(), {
  setHeaders: (res) => {
    // cache the assets for 7 days
    res.setHeader("Cache-Control", "public, max-age=604000");
  },
});

const flow = createFlowProducer();

/**
 * Schedules a screenshot for a project in a specific environment.
 *
 * @param publishId
 * @param projectId
 * @param environment
 */
export async function schedulePublishScreenshot(
  publishId: string,
  projectId: string
) {
  const url = getProxyForwardHostUrl(projectId, publishId);

  await flow.add({
    name: "save-screenshot",
    queueName: projectScreenshotQueue.name,
    prefix: projectScreenshotQueue.prefixKey,
    data: {
      publishId,
      projectId,
    },
    opts: projectScreenshotQueue.defaultJobOptions,
    children: [
      {
        name: `${publishId} screenshot`,
        data: {
          options: {
            height: 800,
            width: 1600,
            interceptHost: {
              original: "http://localhost",
              replacement: url,
            },
          },
          url: "http://localhost",
        },
        queueName: puppeteerScreenshotQueue.name,
        prefix: puppeteerScreenshotQueue.prefixKey,
        opts: puppeteerScreenshotQueue.defaultJobOptions,
      },
    ],
  });
}

/**
 * Updates the screenshot URL values for the publish.
 *
 * Also copies the screenshot to the permanent storage.
 *
 * @param publishId
 * @param projectId
 * @param tempScreenshot
 */
export async function updateScreenshotUrl(
  publishId: string,
  projectId: string,
  tempScreenshot: string
) {
  // TODO: clean up screenshots after a new publish is created

  // copy the screenshot to the permanent storage
  const uploadDir = getScreenshotDir(projectId);
  await mkDirRecursive(uploadDir);

  const screenshotName = `${publishId}.png`;
  const screenshotPath = join(uploadDir, screenshotName);

  await copyFile(tempScreenshot, screenshotPath);
  await rmFile(tempScreenshot);

  const screenshotUrl = `/screenshots/${projectId}/${screenshotName}`;

  // update the screenshot URL in the publish model
  const collection = await getCollection<PublishModel>("projects_published");

  await collection.updateOne(
    { uuid: publishId },
    {
      $set: {
        screenshotUrl: screenshotUrl,
      },
    }
  );
}
