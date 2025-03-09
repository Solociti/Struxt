import { DefaultJobOptions, Queue, Worker, WorkerOptions } from "bullmq";
import { clientUrl } from "./dragonFly.ts";

const queues: Queue[] = [];

/**
 * Get the current list of registered queues
 *
 * @returns
 */
export function getQueues() {
  return queues;
}

/**
 * Listen for registered queues updates
 */
const updateCallbacks: ((list: Queue[]) => void)[] = [];
export function onQueueUpdate(cb: (list: Queue[]) => void) {
  updateCallbacks.push(cb);
}

/**
 * Create a new bull MQ queue
 *
 * @param prefix the prefix is used to lock to a dragon fly thread
 * @param queueName
 * @param defaultJobOptions
 */
export function setupQueue(
  prefix: string,
  queueName: string,
  defaultJobOptions: DefaultJobOptions
) {
  const options: DefaultJobOptions = {
    removeOnComplete: 250,
    removeOnFail: 250,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    ...defaultJobOptions,
  };

  const queue = new Queue(queueName, {
    prefix: `{${prefix}}`,
    connection: {
      url: clientUrl,
    },
    defaultJobOptions: options,
  });

  queues.push(queue);

  updateCallbacks.forEach((cb) => {
    cb(queues);
  });

  return {
    queue,
    cleanUp: () => {
      queue.close();
      queues.splice(queues.indexOf(queue), 1);

      updateCallbacks.forEach((cb) => {
        cb(queues);
      });
    },
  };
}

/**
 * Create a new worker for queues
 *
 * @param prefix the prefix is used to lock to a dragon fly thread
 * @param queueName
 * @param workerFunction
 * @returns
 */
export function setupWorker(
  prefix: string,
  queueName: string,
  workerFunction: (job: any) => Promise<any>,
  workerOptions: Omit<WorkerOptions, "connection" | "prefix">
) {
  const options: WorkerOptions = {
    connection: {
      url: clientUrl,
    },
    prefix: `{${prefix}}`,
    concurrency: 1,
    ...workerOptions,
  };

  const worker = new Worker(queueName, workerFunction, options);

  worker.on("error", (error) => {
    console.error("Worker error", error);
  });

  return worker;
}
