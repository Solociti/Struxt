/**
 * Used to test parts of the aiPilot system during development.
 * Not an actual test file, but a script to run manually.
 *
 * node dist-server/server/aiPilot/testEntry.js
 */
import "dotenv/config";
import { setupAiPilot } from "./agents/agents";

async function main() {
  const agent = await setupAiPilot("chatId", "projectId");

  const stream = await agent.streamResponse(
    "Create a html div card component with a title and description. Inline the css."
  );

  for await (const chunk of stream) {
    console.log(chunk);
  }
  console.log("Stream completed");
}

main().catch(console.error);
