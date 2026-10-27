import { getCollection } from "server/database/mongodb";

export type IdCounterName =
  | "ai_pilot"
  | "ai_pilot_chat"
  | "ai_pilot_prompt"
  | "asset"
  | "submission"
  | "project"
  | "publish"
  | "invite"
  | "file"
  | "routine"
  | "env_variable";

async function counter(name: IdCounterName) {
  const collection = await getCollection<{ value: number; name: string }>(
    "id_counters"
  );

  // update the counter
  const result = await collection.findOneAndUpdate(
    { name },
    { $inc: { value: 1 } },
    { upsert: true, returnDocument: "after" }
  );

  if (!result) {
    throw new Error("Failed to update counter");
  }

  return result.value as number;
}

/**
 * Create a simple unique identifier
 *
 * @param name
 * @returns
 */
export async function createSimpleId(name: IdCounterName) {
  const count = await counter(name);

  const sections = [
    count.toString(36).padStart(4, "0"),
    Date.now().toString(36).padStart(8, "0"),
  ].join("-");

  return sections;
}
