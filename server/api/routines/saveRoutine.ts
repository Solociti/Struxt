import { customError } from "common/custom-error/custom-error";
import { RoutineModel } from "common/models/routines/Routine";
import { getCollection } from "server/database/mongodb";

/**
 * Save the provided routine to the database.
 *
 * @param routine
 * @returns
 */
export async function saveRoutine(routine: RoutineModel) {
  const collection = await getCollection<RoutineModel>("routines");

  // save the routine
  const result = await collection.updateOne(
    {
      projectId: routine.projectId,
      uuid: routine.uuid,
    },
    { $set: routine },
    { upsert: true }
  );

  if (!result.upsertedCount && !result.modifiedCount) {
    throw customError(404, "Routine not found.");
  }

  return {
    success: true,
    routine,
  };
}
