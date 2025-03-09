import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js";
import { ExpressAdapter } from "@bull-board/express";
import { getQueues, onQueueUpdate } from "./setupQueue.ts";

export const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

const { setQueues } = createBullBoard({
  queues: getQueues().map((queue) => new BullMQAdapter(queue)),
  serverAdapter: serverAdapter,
});

onQueueUpdate((queues) => {
  setQueues(queues.map((queue) => new BullMQAdapter(queue)));
});
