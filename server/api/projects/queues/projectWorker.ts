import { setupWorker } from "server/database/setupQueue";
import { sendProjectInviteEmail } from "../invites/sendProjectInviteEmail";
import { updateScreenshotUrl } from "../projectScreenshots";

setupWorker(
  "projects",
  "invites",
  async (job) => {
    switch (job.name) {
      case "send-invite":
        const inviteId = job.data.inviteId;
        return await sendProjectInviteEmail(inviteId);

      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  },
  {
    concurrency: 1,
    stalledInterval: 1000 * 60 * 5,
  }
);

setupWorker(
  "projects",
  "project-screenshots",
  async (job) => {
    switch (job.name) {
      case "save-screenshot":
        const { publishId, projectId } = job.data;

        // get the child job data
        const childrenValues = await job.getChildrenValues();
        const list = Object.values(childrenValues);
        if (list.length === 0) {
          throw new Error("No child jobs found for the screenshot job.");
        }

        const { screenshotPath } = list[0] as { screenshotPath: string };
        if (!screenshotPath) {
          return null;
        }

        // save the screenshot URL to the publish and project
        return await updateScreenshotUrl(publishId, projectId, screenshotPath);

      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  },
  {
    concurrency: 1,
    stalledInterval: 1000 * 60,
  }
);
