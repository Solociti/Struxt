import { setupQueue, setupWorker } from "../../database/setupQueue";
import { sendFormEmail } from "./sendFormEmail";

const { queue } = setupQueue("public", "form-submission", {});

/**
 * Schedule a email to be sent for the form submission
 *
 * @param submissionId
 * @returns
 */
export async function scheduleFormSubmissionEmail(submissionId: string) {
  return await queue.add("send-email", {
    submissionId,
  });
}

setupWorker(
  "public",
  "form-submission",
  async (job) => {
    switch (job.name) {
      case "send-email":
        // send email
        return await sendFormEmail(job.data.submissionId);
        break;
      default:
        throw new Error("Invalid job name");
    }
  },
  {}
);
