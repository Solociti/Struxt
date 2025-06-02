import { setupQueue } from "server/database/setupQueue";

export const inviteQueue = setupQueue("projects", "invites", {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 20000,
  },
  removeOnComplete: 10,
  removeOnFail: 10,
});

/**
 * Schedule the invite email to be sent
 *
 * @param inviteId
 */
export async function scheduleInviteEmail(inviteId: string) {
  await inviteQueue.queue.add(
    "send-invite",
    {
      inviteId,
    },
    {
      // delay by 30 seconds, to allow the user to undo the invite if needed.
      delay: 1000 * 30,
    }
  );
}
