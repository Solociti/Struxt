import { execRoutine } from "../execRoutine";

if (process.env.CONTAINER_NAME !== "function-runner") {
  setInterval(() => {
    execRoutine();
  }, 5000);
}
