import { setupQueue } from "server/database/setupQueue";

const queue = setupQueue("routines", "scheduled", {
  removeOnComplete: 50,
  removeOnFail: 50,
});
