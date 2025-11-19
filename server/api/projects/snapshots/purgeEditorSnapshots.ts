import { EditorSnapshotModel } from "common/models/projects/EditorSnapshot";
import { getCollection, toArray } from "server/database/mongodb";
import { daysAgo, purgeRules } from "./snapshotUtils";

/**
 * Get the list of project ids that have snapshots
 *
 * @returns
 */
export async function getProjectIds() {
  const collection = await getCollection<EditorSnapshotModel>(
    "editor_snapshots"
  );

  const cursor = await collection.aggregate([
    {
      $group: {
        _id: "$projectId",
      },
    },
    {
      $project: {
        _id: 0,
        projectId: "$_id",
      },
    },
  ]);

  const docs = await toArray(cursor);
  return docs.map((doc) => doc.projectId);
}

/**
 * Purge editor snapshots for a project
 *
 * @param projectId
 */
export async function purgeEditorSnapshots(
  projectId: string,
  eventType: EditorSnapshotModel["eventType"],
  log: (message: string) => Promise<void>
) {
  const collection = await getCollection<EditorSnapshotModel>(
    "editor_snapshots"
  );

  const purgeRule = purgeRules[eventType];

  let protectedDates: number[] = [];

  // get the list of snapshots to protect from purging
  const mostRecent = await getMostRecentSnapshots(
    projectId,
    eventType,
    purgeRule.keepRecentCount
  );
  protectedDates.push(...mostRecent);
  await log(`Most Recent: ${mostRecent.length}`);

  // get the list of daily snapshots to protect from purging
  const dailySnapshots = await getDailySnapshots(
    projectId,
    eventType,
    purgeRule.dailyRetentionDays
  );
  protectedDates.push(...dailySnapshots);
  await log(`Daily: ${dailySnapshots.length}`);

  // get the list of monthly snapshots to protect from purging
  const monthlySnapshots = await getMonthlySnapshots(
    projectId,
    eventType,
    purgeRule.monthlyRetentionMonths * 31
  );
  protectedDates.push(...monthlySnapshots);
  await log(`Monthly: ${monthlySnapshots.length}`);

  // remove duplicates
  protectedDates = [...new Set(protectedDates)];
  await log(`Unique: ${protectedDates.length}`);

  // purge the snapshots
  const deleteResult = await collection.deleteMany({
    projectId,
    eventType,
    "locked.active": false,
    snapshotTime: {
      $nin: protectedDates,
    },
  });

  return {
    protectedDates,
    deleteResult,
  };
}

/**
 * Get the most recent snapshots that should be protected from purging
 *
 * @param projectId
 * @param eventType
 * @returns
 */
async function getMostRecentSnapshots(
  projectId: string,
  eventType: EditorSnapshotModel["eventType"],
  keep: number
) {
  const collection = await getCollection<EditorSnapshotModel>(
    "editor_snapshots"
  );

  const cursor = await collection
    .find(
      {
        projectId,
        eventType,
      },
      {
        sort: {
          snapshotTime: -1,
        },
        projection: {
          snapshotTime: 1,
        },
      }
    )
    .limit(keep);

  const docs = await toArray(cursor);
  return docs.map((doc) => doc.snapshotTime);
}

/**
 * Get the first snapshot for each day that should be protected from purging
 *
 * @param projectId
 * @param eventType
 * @param days
 * @returns
 */
async function getDailySnapshots(
  projectId: string,
  eventType: EditorSnapshotModel["eventType"],
  days: number
) {
  const collection = await getCollection<EditorSnapshotModel>(
    "editor_snapshots"
  );

  const cursor = await collection.aggregate([
    {
      $match: {
        projectId,
        eventType,
        snapshotTime: {
          $gte: daysAgo(days),
        },
      },
    },
    {
      $group: {
        _id: {
          day: {
            $dayOfYear: { $toDate: { $multiply: ["$snapshotTime", 1000] } },
          },
          year: { $year: { $toDate: { $multiply: ["$snapshotTime", 1000] } } },
        },
        snapshotTime: { $min: "$snapshotTime" },
      },
    },
  ]);

  const docs = await toArray(cursor);
  return docs.map((doc) => doc.snapshotTime as number);
}

async function getMonthlySnapshots(
  projectId: string,
  eventType: EditorSnapshotModel["eventType"],
  days: number
) {
  if (days === 0) {
    return [];
  }

  const collection = await getCollection<EditorSnapshotModel>(
    "editor_snapshots"
  );

  const cursor = await collection.aggregate([
    {
      $match: {
        projectId,
        eventType,
        snapshotTime: {
          $gte: daysAgo(days),
        },
      },
    },
    {
      $group: {
        _id: {
          month: {
            $month: { $toDate: { $multiply: ["$snapshotTime", 1000] } },
          },
          year: {
            $year: { $toDate: { $multiply: ["$snapshotTime", 1000] } },
          },
        },
        snapshotTime: { $min: "$snapshotTime" },
      },
    },
  ]);

  const docs = await toArray(cursor);
  return docs.map((doc) => doc.snapshotTime as number);
}
