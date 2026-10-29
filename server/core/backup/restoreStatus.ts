import { Job } from "bullmq";
import { restoreQueue } from "./restoreQueue";

export interface RestoreStep {
  name: string;
  state: string;
  progress: number;
}

export interface RestoreStatus {
  state: "running" | "completed" | "failed" | "not-found";
  steps: RestoreStep[];
  failedReason?: string;
}

/**
 * Get a compact status of a restore run.
 *
 * @param runId the id returned when the restore was scheduled
 * @returns
 */
export async function getRestoreStatus(runId: string): Promise<RestoreStatus> {
  const kickoff = await restoreQueue.queue.getJob(runId);
  if (!kickoff || kickoff.name !== "restore-kickoff") {
    return { state: "not-found", steps: [] };
  }

  const flowJobs = (
    await restoreQueue.queue.getJobs([
      "active",
      "waiting",
      "waiting-children",
      "delayed",
      "prioritized",
      "completed",
      "failed",
    ])
  ).filter((job) => job.data?.runId === runId);

  const jobs: Job[] = [kickoff, ...flowJobs];
  const steps: RestoreStep[] = [];
  let failedReason: string | undefined;
  let finished = false;

  for (const job of jobs) {
    const state = await job.getState();
    const progress = typeof job.progress === "number" ? job.progress : 0;
    steps.push({ name: job.name, state, progress });

    if (
      state === "failed" &&
      (!failedReason || job.name !== "restore-finish")
    ) {
      failedReason = `${job.name}: ${job.failedReason}`;
    }
    if (state === "completed" && job.name === "restore-finish") {
      finished = true;
    }
  }

  const kickoffState = steps[0].state;
  if (failedReason) {
    return { state: "failed", steps, failedReason };
  }
  if (
    finished ||
    (kickoffState === "completed" && kickoff.returnvalue?.dryRun)
  ) {
    return { state: "completed", steps };
  }

  return { state: "running", steps };
}
