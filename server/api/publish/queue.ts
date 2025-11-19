import { setupQueue } from "server/database/setupQueue";

export const publishQueue = setupQueue("projects", "publish", {
  removeOnComplete: 250,
  removeOnFail: 250,
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 30000,
  },
});

/**
 * Schedule a clean publish job for the given project
 *
 * @param projectId
 * @returns
 */
export async function scheduleCleanPublish(projectId: string) {
  return await publishQueue.queue.add(
    "clean-publish",
    {
      projectId,
    },
    {
      delay: 5 * 60 * 1000,
    }
  );
}
