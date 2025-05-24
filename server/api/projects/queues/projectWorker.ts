import { setupWorker } from "server/database/setupQueue";
import { sendProjectInviteEmail } from "../invites/sendProjectInviteEmail";

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
